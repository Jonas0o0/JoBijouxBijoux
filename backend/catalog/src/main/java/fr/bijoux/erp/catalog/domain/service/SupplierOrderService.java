package fr.bijoux.erp.catalog.domain.service;

import fr.bijoux.erp.catalog.domain.model.*;
import fr.bijoux.erp.catalog.domain.repository.InventoryMovementRepository;
import fr.bijoux.erp.catalog.domain.repository.JewelryItemRepository;
import fr.bijoux.erp.catalog.domain.repository.StorageLocationRepository;
import fr.bijoux.erp.catalog.domain.repository.SupplierOrderRepository;
import fr.bijoux.erp.catalog.dto.OrderItemDto;
import fr.bijoux.erp.catalog.dto.SupplierOrderResponse;
import fr.bijoux.erp.core.domain.valueobject.GoldFineness;
import fr.bijoux.erp.core.domain.valueobject.MoneyAmount;
import fr.bijoux.erp.core.domain.valueobject.WeightInGrams;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

/**
 * Service de gestion des commandes d'achat fournisseurs et réassort joaillier.
 */
@Service
public class SupplierOrderService {

    private final SupplierOrderRepository supplierOrderRepository;
    private final JewelryItemRepository jewelryItemRepository;
    private final StorageLocationRepository storageLocationRepository;
    private final InventoryMovementRepository inventoryMovementRepository;

    public SupplierOrderService(SupplierOrderRepository supplierOrderRepository,
                                JewelryItemRepository jewelryItemRepository,
                                StorageLocationRepository storageLocationRepository,
                                InventoryMovementRepository inventoryMovementRepository) {
        this.supplierOrderRepository = supplierOrderRepository;
        this.jewelryItemRepository = jewelryItemRepository;
        this.storageLocationRepository = storageLocationRepository;
        this.inventoryMovementRepository = inventoryMovementRepository;
    }

    /**
     * Crée une nouvelle commande fournisseur pour réassort.
     */
    @Transactional
    public SupplierOrderResponse createOrder(Long storeId, String supplierName, List<OrderItemDto> items) {
        if (storeId == null) {
            throw new IllegalArgumentException("Le point de vente (storeId) est obligatoire");
        }
        if (supplierName == null || supplierName.isBlank()) {
            throw new IllegalArgumentException("Le nom du fournisseur est obligatoire");
        }
        if (items == null || items.isEmpty()) {
            throw new IllegalArgumentException("La commande doit comporter au moins un article");
        }

        long seq = supplierOrderRepository.countByStoreId(storeId) + 1L;
        String orderNumber = String.format("SUP-%d-%06d", storeId, seq);

        SupplierOrder order = new SupplierOrder(orderNumber, storeId, supplierName.trim());

        for (OrderItemDto dto : items) {
            SupplierOrderItem item = new SupplierOrderItem(
                    dto.referenceNumber(),
                    dto.designation(),
                    dto.quantity(),
                    dto.unitPurchasePriceHtCents(),
                    dto.fineness() != null ? dto.fineness() : GoldFineness.OR_750,
                    dto.grossWeightGrams() != null ? dto.grossWeightGrams() : new BigDecimal("3.500"),
                    dto.sellingPriceTtcCents(),
                    dto.vatRegime() != null ? dto.vatRegime() : VatRegime.STANDARD_20
            );
            order.addItem(item);
        }

        order.recalculateTotals();
        SupplierOrder saved = supplierOrderRepository.save(order);
        return SupplierOrderResponse.fromEntity(saved);
    }

    /**
     * Réceptionne une commande fournisseur : incrémente le stock de chaque article concerné
     * (vitrine ou coffre) et enregistre l'entrée dans les mouvements de stock.
     */
    @Transactional
    public SupplierOrderResponse receiveOrder(Long orderId, String destinationStock) {
        if (orderId == null) {
            throw new IllegalArgumentException("L'identifiant de commande est obligatoire");
        }
        if (destinationStock == null || destinationStock.isBlank()) {
            throw new IllegalArgumentException("L'emplacement de destination (VITRINE ou COFFRE) est obligatoire");
        }

        SupplierOrder order = supplierOrderRepository.findById(orderId)
                .orElseThrow(() -> new IllegalArgumentException("Commande fournisseur introuvable id=" + orderId));

        if (order.getStatus() == SupplierOrderStatus.RECEPTIONNE) {
            throw new IllegalStateException("La commande fournisseur " + order.getOrderNumber() + " a déjà été entièrement réceptionnée");
        }

        String destNormalized = destinationStock.trim().toUpperCase();
        StorageLocationType targetLocationType;
        JewelryItemStatus targetItemStatus;

        if (destNormalized.contains("VITRINE")) {
            targetLocationType = StorageLocationType.VITRINE;
            targetItemStatus = JewelryItemStatus.EN_VITRINE;
        } else if (destNormalized.contains("COFFRE")) {
            targetLocationType = StorageLocationType.COFFRE_FORT;
            targetItemStatus = JewelryItemStatus.AU_COFFRE;
        } else {
            throw new IllegalArgumentException("Emplacement de destination non reconnu : '" + destinationStock + "'. Valeurs acceptées : VITRINE, COFFRE");
        }

        // Trouver ou créer l'emplacement cible du magasin
        StorageLocation location = storageLocationRepository.findByStoreIdAndLocationType(order.getStoreId(), targetLocationType)
                .stream().findFirst()
                .orElseGet(() -> {
                    String code = (targetLocationType == StorageLocationType.VITRINE) ? "VIT-01" : "COF-01";
                    String name = (targetLocationType == StorageLocationType.VITRINE) ? "Vitrine Exposition Principale" : "Coffre-fort Principal";
                    StorageLocation newLoc = new StorageLocation(order.getStoreId(), code, name, targetLocationType);
                    return storageLocationRepository.save(newLoc);
                });

        // Pour chaque article de la commande, générer les pièces sérialisées unitaires et le mouvement de stock
        for (SupplierOrderItem item : order.getItems()) {
            int quantityToReceive = item.getQuantity() - item.getReceivedQuantity();
            if (quantityToReceive <= 0) {
                continue;
            }

            for (int i = 0; i < quantityToReceive; i++) {
                String serialNumber = String.format("SN-%d-%s-%03d",
                        order.getStoreId(),
                        UUID.randomUUID().toString().substring(0, 8).toUpperCase(),
                        i + 1
                );

                JewelryItem jewelryItem = new JewelryItem(
                        serialNumber,
                        item.getReferenceNumber(),
                        item.getDesignation(),
                        item.getFineness(),
                        WeightInGrams.of(item.getGrossWeightGrams()),
                        MoneyAmount.ofCents(item.getSellingPriceTtcCents()),
                        MoneyAmount.ofCents(item.getUnitPurchasePriceHtCents()),
                        item.getVatRegime(),
                        order.getStoreId()
                );
                jewelryItem.setStorageLocation(location);
                jewelryItem.setStatus(targetItemStatus);

                JewelryItem savedJewelry = jewelryItemRepository.save(jewelryItem);

                InventoryMovement movement = new InventoryMovement(
                        savedJewelry,
                        MovementType.ENTREE_STOCK,
                        null,
                        location,
                        "FOURNISSEUR: " + order.getSupplierName(),
                        String.format("Entrée réassort - Commande %s (Réf: %s)", order.getOrderNumber(), item.getReferenceNumber())
                );
                inventoryMovementRepository.save(movement);
            }

            item.setReceivedQuantity(item.getQuantity());
        }

        order.setStatus(SupplierOrderStatus.RECEPTIONNE);
        order.setDestinationStock(destNormalized);
        order.setReceivedAt(Instant.now());

        SupplierOrder savedOrder = supplierOrderRepository.save(order);
        return SupplierOrderResponse.fromEntity(savedOrder);
    }

    @Transactional(readOnly = true)
    public SupplierOrderResponse getOrderById(Long orderId) {
        SupplierOrder order = supplierOrderRepository.findById(orderId)
                .orElseThrow(() -> new IllegalArgumentException("Commande fournisseur introuvable id=" + orderId));
        return SupplierOrderResponse.fromEntity(order);
    }

    @Transactional(readOnly = true)
    public List<SupplierOrderResponse> getOrdersByStore(Long storeId) {
        return supplierOrderRepository.findByStoreIdOrderByCreatedAtDesc(storeId).stream()
                .map(SupplierOrderResponse::fromEntity)
                .toList();
    }
}
