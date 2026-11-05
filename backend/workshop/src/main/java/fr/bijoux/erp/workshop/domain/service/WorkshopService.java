package fr.bijoux.erp.workshop.domain.service;

import fr.bijoux.erp.workshop.domain.model.CustomManufacturingOrder;
import fr.bijoux.erp.workshop.domain.model.RepairOrder;
import fr.bijoux.erp.workshop.domain.model.WorkshopComponent;
import fr.bijoux.erp.workshop.domain.model.WorkshopStatus;
import fr.bijoux.erp.workshop.domain.repository.CustomManufacturingOrderRepository;
import fr.bijoux.erp.workshop.domain.repository.RepairOrderRepository;
import fr.bijoux.erp.workshop.dto.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.util.List;

@Service
public class WorkshopService {

    private static final BigDecimal MIN_FIRE_LOSS = new BigDecimal("3.00");
    private static final BigDecimal MAX_FIRE_LOSS = new BigDecimal("8.00");

    private final RepairOrderRepository repairOrderRepository;
    private final CustomManufacturingOrderRepository customOrderRepository;

    public WorkshopService(RepairOrderRepository repairOrderRepository,
                           CustomManufacturingOrderRepository customOrderRepository) {
        this.repairOrderRepository = repairOrderRepository;
        this.customOrderRepository = customOrderRepository;
    }

    @Transactional
    public RepairOrderResponse createRepairOrder(CreateRepairOrderRequest request) {
        long seq = repairOrderRepository.countByStoreId(request.storeId()) + 1L;
        String orderNumber = String.format("REP-%d-%06d", request.storeId(), seq);

        RepairOrder order = new RepairOrder(
                orderNumber,
                request.storeId(),
                request.customerId(),
                request.operatorUsername(),
                request.itemDescription(),
                request.metalType(),
                request.fineness(),
                request.grossWeightGrams(),
                request.svgDefectDiagram(),
                request.estimatedQuoteCents()
        );
        order.setCustomerNotes(request.customerNotes());

        RepairOrder saved = repairOrderRepository.save(order);
        return RepairOrderResponse.fromEntity(saved);
    }

    @Transactional
    public RepairOrderResponse updateRepairStatus(Long orderId, WorkshopStatusUpdateRequest request) {
        RepairOrder order = repairOrderRepository.findById(orderId)
                .orElseThrow(() -> new IllegalArgumentException("Fiche de réparation introuvable id=" + orderId));

        if (!order.getStatus().canTransitionTo(request.newStatus())) {
            throw new IllegalStateException(String.format(
                    "Transition d'état d'atelier invalide : %s -> %s",
                    order.getStatus(), request.newStatus()
            ));
        }

        order.setStatus(request.newStatus());
        order.setUpdatedAt(Instant.now());

        if (request.assignedArtisanUsername() != null && !request.assignedArtisanUsername().isBlank()) {
            order.setAssignedArtisanUsername(request.assignedArtisanUsername());
        }
        if (request.finalPriceCents() != null) {
            order.setFinalPriceCents(request.finalPriceCents());
        }
        if (request.newStatus() == WorkshopStatus.RESTITUE) {
            order.setActualDeliveryDate(Instant.now());
        }

        RepairOrder updated = repairOrderRepository.save(order);
        return RepairOrderResponse.fromEntity(updated);
    }

    @Transactional
    public CustomOrderResponse createCustomOrder(CreateCustomOrderRequest request) {
        BigDecimal fireLoss = request.fireLossPercentage() != null ? request.fireLossPercentage() : new BigDecimal("5.00");
        validateFireLossPercentage(fireLoss);

        long seq = customOrderRepository.countByStoreId(request.storeId()) + 1L;
        String orderNumber = String.format("CUST-%d-%06d", request.storeId(), seq);

        BigDecimal expectedFinalWeight = calculateNetWeightAfterFireLoss(request.estimatedGoldWeightGrams(), fireLoss);

        CustomManufacturingOrder order = new CustomManufacturingOrder(
                orderNumber,
                request.storeId(),
                request.customerId(),
                request.operatorUsername(),
                request.title(),
                request.description(),
                request.estimatedGoldWeightGrams(),
                fireLoss,
                request.quotePriceCents()
        );
        order.setFinalWeightGrams(expectedFinalWeight);

        if (request.components() != null) {
            for (CreateCustomOrderRequest.ComponentDto compDto : request.components()) {
                WorkshopComponent comp = new WorkshopComponent(
                        compDto.componentName(),
                        compDto.quantity(),
                        compDto.unitCostCents()
                );
                order.addComponent(comp);
            }
        }

        CustomManufacturingOrder saved = customOrderRepository.save(order);
        return CustomOrderResponse.fromEntity(saved);
    }

    @Transactional
    public CustomOrderResponse updateCustomStatus(Long orderId, WorkshopStatusUpdateRequest request) {
        CustomManufacturingOrder order = customOrderRepository.findById(orderId)
                .orElseThrow(() -> new IllegalArgumentException("Commande de fabrication sur-mesure introuvable id=" + orderId));

        if (!order.getStatus().canTransitionTo(request.newStatus())) {
            throw new IllegalStateException(String.format(
                    "Transition d'état d'atelier sur-mesure invalide : %s -> %s",
                    order.getStatus(), request.newStatus()
            ));
        }

        order.setStatus(request.newStatus());
        order.setUpdatedAt(Instant.now());

        if (request.assignedArtisanUsername() != null && !request.assignedArtisanUsername().isBlank()) {
            order.setAssignedArtisanUsername(request.assignedArtisanUsername());
        }

        CustomManufacturingOrder updated = customOrderRepository.save(order);
        return CustomOrderResponse.fromEntity(updated);
    }

    public BigDecimal calculateNetWeightAfterFireLoss(BigDecimal initialWeightGrams, BigDecimal fireLossPercentage) {
        validateFireLossPercentage(fireLossPercentage);
        if (initialWeightGrams == null || initialWeightGrams.compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalArgumentException("Le poids initial doit être strictement positif");
        }

        BigDecimal lossMultiplier = BigDecimal.ONE.subtract(
                fireLossPercentage.divide(new BigDecimal("100"), 4, RoundingMode.HALF_UP)
        );
        return initialWeightGrams.multiply(lossMultiplier).setScale(3, RoundingMode.HALF_UP);
    }

    private void validateFireLossPercentage(BigDecimal fireLoss) {
        if (fireLoss == null || fireLoss.compareTo(MIN_FIRE_LOSS) < 0 || fireLoss.compareTo(MAX_FIRE_LOSS) > 0) {
            throw new IllegalArgumentException(String.format(
                    "Le taux de perte au feu (freinte) doit être compris entre 3.00%% et 8.00%% (valeur reçue : %s%%)",
                    fireLoss
            ));
        }
    }

    @Transactional(readOnly = true)
    public List<RepairOrderResponse> getRepairOrdersByStore(Long storeId) {
        return repairOrderRepository.findByStoreIdOrderByCreatedAtDesc(storeId).stream()
                .map(RepairOrderResponse::fromEntity)
                .toList();
    }
}
