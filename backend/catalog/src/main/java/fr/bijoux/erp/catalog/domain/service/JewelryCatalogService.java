package fr.bijoux.erp.catalog.domain.service;

import fr.bijoux.erp.catalog.domain.model.*;
import fr.bijoux.erp.catalog.domain.repository.InventoryMovementRepository;
import fr.bijoux.erp.catalog.domain.repository.JewelryItemRepository;
import fr.bijoux.erp.catalog.domain.repository.StorageLocationRepository;
import fr.bijoux.erp.core.domain.valueobject.GoldFineness;
import fr.bijoux.erp.core.domain.valueobject.MoneyAmount;
import fr.bijoux.erp.core.domain.valueobject.WeightInGrams;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.Objects;
import java.util.Optional;

/**
 * Service de gestion unitaire du stock de pièces de joaillerie et bijouterie.
 */
@Service
public class JewelryCatalogService {

    private final JewelryItemRepository jewelryItemRepository;
    private final StorageLocationRepository storageLocationRepository;
    private final InventoryMovementRepository inventoryMovementRepository;

    public JewelryCatalogService(JewelryItemRepository jewelryItemRepository,
                                 StorageLocationRepository storageLocationRepository,
                                 InventoryMovementRepository inventoryMovementRepository) {
        this.jewelryItemRepository = jewelryItemRepository;
        this.storageLocationRepository = storageLocationRepository;
        this.inventoryMovementRepository = inventoryMovementRepository;
    }

    /**
     * Enregistre une nouvelle pièce joaillière en stock avec traçabilité complète.
     */
    @Transactional
    public JewelryItem createJewelryItem(String serialNumber,
                                         String referenceNumber,
                                         String designation,
                                         GoldFineness fineness,
                                         WeightInGrams grossWeight,
                                         WeightInGrams estimatedNetWeight,
                                         MoneyAmount sellingPriceTtc,
                                         MoneyAmount purchasePriceHt,
                                         VatRegime taxRegime,
                                         Long storeId,
                                         Long storageLocationId,
                                         String createdBy) {
        if (jewelryItemRepository.existsBySerialNumber(serialNumber)) {
            throw new IllegalArgumentException("Un bijou avec le numéro de série '" + serialNumber + "' existe déjà");
        }

        JewelryItem item = new JewelryItem(
                serialNumber,
                referenceNumber,
                designation,
                fineness,
                grossWeight,
                sellingPriceTtc,
                purchasePriceHt,
                taxRegime,
                storeId
        );
        if (estimatedNetWeight != null) {
            item.setEstimatedNetWeight(estimatedNetWeight);
        }

        if (storageLocationId != null) {
            StorageLocation location = storageLocationRepository.findById(storageLocationId)
                    .orElseThrow(() -> new IllegalArgumentException("Emplacement introuvable : " + storageLocationId));
            item.setStorageLocation(location);
            item.setStatus(determineStatusFromLocation(location.getLocationType()));
        }

        JewelryItem saved = jewelryItemRepository.save(item);

        InventoryMovement movement = new InventoryMovement(
                saved,
                MovementType.ENTREE_STOCK,
                null,
                item.getStorageLocation(),
                createdBy != null ? createdBy : "SYSTEM",
                "Entrée initiale en stock"
        );
        inventoryMovementRepository.save(movement);

        return saved;
    }

    /**
     * Déplace une pièce vers un nouvel emplacement physique (ex: coffre -> vitrine).
     */
    @Transactional
    public JewelryItem moveToLocation(Long itemId, Long targetLocationId, String performedBy, String notes) {
        JewelryItem item = jewelryItemRepository.findById(itemId)
                .orElseThrow(() -> new IllegalArgumentException("Bijou introuvable id=" + itemId));

        StorageLocation targetLocation = storageLocationRepository.findById(targetLocationId)
                .orElseThrow(() -> new IllegalArgumentException("Emplacement cible introuvable id=" + targetLocationId));

        StorageLocation previousLocation = item.getStorageLocation();
        item.setStorageLocation(targetLocation);
        item.setStatus(determineStatusFromLocation(targetLocation.getLocationType()));
        item.setUpdatedAt(Instant.now());

        JewelryItem updated = jewelryItemRepository.save(item);

        InventoryMovement movement = new InventoryMovement(
                updated,
                MovementType.TRANSFERT_EMPLACEMENT,
                previousLocation,
                targetLocation,
                performedBy,
                notes != null ? notes : "Déplacement interne vers " + targetLocation.getName()
        );
        inventoryMovementRepository.save(movement);

        return updated;
    }

    /**
     * Met à jour le statut d'un bijou (ex: VENDU, A_L_ATELIER).
     */
    @Transactional
    public JewelryItem updateStatus(Long itemId, JewelryItemStatus newStatus, String performedBy, String notes) {
        JewelryItem item = jewelryItemRepository.findById(itemId)
                .orElseThrow(() -> new IllegalArgumentException("Bijou introuvable id=" + itemId));

        JewelryItemStatus oldStatus = item.getStatus();
        item.setStatus(newStatus);
        item.setUpdatedAt(Instant.now());

        JewelryItem updated = jewelryItemRepository.save(item);

        MovementType movementType = switch (newStatus) {
            case VENDU -> MovementType.SORTIE_VENTE;
            case A_L_ATELIER -> MovementType.DEPOT_ATELIER;
            case REFONDU -> MovementType.REFONTE;
            default -> MovementType.TRANSFERT_EMPLACEMENT;
        };

        InventoryMovement movement = new InventoryMovement(
                updated,
                movementType,
                item.getStorageLocation(),
                item.getStorageLocation(),
                performedBy,
                notes != null ? notes : "Changement de statut : " + oldStatus + " -> " + newStatus
        );
        inventoryMovementRepository.save(movement);

        return updated;
    }

    @Transactional(readOnly = true)
    public Optional<JewelryItem> findBySerialNumber(String serialNumber) {
        return jewelryItemRepository.findBySerialNumber(serialNumber);
    }

    @Transactional(readOnly = true)
    public List<JewelryItem> findAvailableInStore(Long storeId) {
        return jewelryItemRepository.findAll().stream()
                .filter(i -> Objects.equals(i.getStoreId(), storeId) && i.getStatus().isAvailableForSale())
                .toList();
    }

    /**
     * Transfère une pièce de joaillerie vers une autre boutique du réseau avec traçabilité sécurisée.
     */
    @Transactional
    public JewelryItem transferToStore(Long itemId, Long targetStoreId, Long targetLocationId, String performedBy, String transferSlipNumber, String notes) {
        JewelryItem item = jewelryItemRepository.findById(itemId)
                .orElseThrow(() -> new IllegalArgumentException("Bijou introuvable id=" + itemId));

        Long previousStoreId = item.getStoreId();
        StorageLocation previousLocation = item.getStorageLocation();

        item.setStoreId(targetStoreId);
        if (targetLocationId != null) {
            StorageLocation targetLocation = storageLocationRepository.findById(targetLocationId)
                    .orElse(null);
            if (targetLocation != null) {
                item.setStorageLocation(targetLocation);
                item.setStatus(determineStatusFromLocation(targetLocation.getLocationType()));
            }
        }
        item.setUpdatedAt(Instant.now());

        JewelryItem updated = jewelryItemRepository.save(item);

        String slipInfo = transferSlipNumber != null ? " [Bordereau " + transferSlipNumber + "]" : "";
        String fullNotes = "Transfert boutique " + previousStoreId + " -> " + targetStoreId + slipInfo + (notes != null ? " : " + notes : "");

        InventoryMovement movement = new InventoryMovement(
                updated,
                MovementType.TRANSFERT_EMPLACEMENT,
                previousLocation,
                item.getStorageLocation(),
                performedBy != null ? performedBy : "VENDEUR",
                fullNotes
        );
        inventoryMovementRepository.save(movement);

        return updated;
    }

    @Transactional(readOnly = true)
    public List<JewelryItem> findItemsByStore(Long storeId, JewelryItemStatus status) {
        return jewelryItemRepository.findAll().stream()
                .filter(i -> storeId == null || Objects.equals(i.getStoreId(), storeId))
                .filter(i -> status == null || i.getStatus() == status)
                .toList();
    }

    private JewelryItemStatus determineStatusFromLocation(StorageLocationType type) {
        return switch (type) {
            case VITRINE, PLATEAU -> JewelryItemStatus.EN_VITRINE;
            case COFFRE_FORT -> JewelryItemStatus.AU_COFFRE;
            case ATELIER, TIROIR_SAV -> JewelryItemStatus.A_L_ATELIER;
        };
    }
}
