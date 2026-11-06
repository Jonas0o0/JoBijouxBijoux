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
import java.util.ArrayList;
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
        if (request.depositPaidCents() != null) {
            order.setDepositPaidCents(request.depositPaidCents());
        }
        if (request.laborCostCents() != null) {
            order.setLaborCostCents(request.laborCostCents());
        }

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

    /**
     * Prépare le décompte de facturation d'une réparation SAV :
     * Calcule le solde restant dû (coût total - acompte versé),
     * liste la main d'œuvre (façon joaillière) et les fournitures (or/pierres/rhodiage).
     */
    @Transactional(readOnly = true)
    public RepairInvoiceDto prepareRepairInvoice(Long repairOrderId) {
        RepairOrder order = repairOrderRepository.findById(repairOrderId)
                .orElseThrow(() -> new IllegalArgumentException("Fiche de réparation introuvable id=" + repairOrderId));

        List<RepairInvoiceDto.SupplyDetailDto> supplies = new ArrayList<>();
        long totalSuppliesCents = 0L;

        if (order.getComponents() != null) {
            for (WorkshopComponent comp : order.getComponents()) {
                long lineTotal = comp.getUnitCostCents() * comp.getQuantity();
                totalSuppliesCents += lineTotal;
                supplies.add(new RepairInvoiceDto.SupplyDetailDto(
                        comp.getComponentName(),
                        comp.getQuantity(),
                        comp.getUnitCostCents(),
                        lineTotal
                ));
            }
        }

        // Main d'œuvre (façon joaillière)
        long laborCents;
        if (order.getLaborCostCents() != null && order.getLaborCostCents() > 0) {
            laborCents = order.getLaborCostCents();
        } else if (order.getFinalPriceCents() != null && order.getFinalPriceCents() > totalSuppliesCents) {
            laborCents = order.getFinalPriceCents() - totalSuppliesCents;
        } else if (order.getEstimatedQuoteCents() != null && order.getEstimatedQuoteCents() > totalSuppliesCents) {
            laborCents = order.getEstimatedQuoteCents() - totalSuppliesCents;
        } else {
            laborCents = order.getLaborCostCents() != null ? order.getLaborCostCents() : 0L;
        }

        // Coût total de la réparation
        long totalCostCents;
        if (order.getFinalPriceCents() != null && order.getFinalPriceCents() > 0) {
            totalCostCents = order.getFinalPriceCents();
        } else if (order.getEstimatedQuoteCents() != null && order.getEstimatedQuoteCents() > 0) {
            totalCostCents = order.getEstimatedQuoteCents();
        } else {
            totalCostCents = laborCents + totalSuppliesCents;
        }

        long depositPaidCents = order.getDepositPaidCents() != null ? order.getDepositPaidCents() : 0L;
        long remainingBalanceCents = Math.max(0L, totalCostCents - depositPaidCents);

        RepairInvoiceDto.LaborDetailDto labor = new RepairInvoiceDto.LaborDetailDto(
                "Façon joaillière & main d'œuvre atelier",
                laborCents
        );

        return new RepairInvoiceDto(
                order.getId(),
                order.getOrderNumber(),
                order.getStoreId(),
                order.getCustomerId(),
                order.getItemDescription(),
                order.getMetalType(),
                order.getFineness(),
                order.getGrossWeightGrams(),
                totalCostCents,
                depositPaidCents,
                remainingBalanceCents,
                labor,
                supplies,
                order.getStatus().name(),
                Instant.now()
        );
    }

    /**
     * Marque la réparation comme LIVRE_ET_FACTURE suite à l'encaissement en caisse.
     */
    @Transactional
    public RepairOrder markDeliveredAndInvoiced(Long repairOrderId) {
        RepairOrder order = repairOrderRepository.findById(repairOrderId)
                .orElseThrow(() -> new IllegalArgumentException("Fiche de réparation introuvable id=" + repairOrderId));

        order.setStatus(WorkshopStatus.LIVRE_ET_FACTURE);
        order.setActualDeliveryDate(Instant.now());
        order.setUpdatedAt(Instant.now());

        return repairOrderRepository.save(order);
    }
}
