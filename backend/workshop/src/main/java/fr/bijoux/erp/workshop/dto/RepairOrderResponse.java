package fr.bijoux.erp.workshop.dto;

import fr.bijoux.erp.workshop.domain.model.RepairOrder;
import fr.bijoux.erp.workshop.domain.model.WorkshopStatus;

import java.math.BigDecimal;
import java.time.Instant;

public record RepairOrderResponse(
        Long id,
        String orderNumber,
        Long storeId,
        Long customerId,
        String operatorUsername,
        String assignedArtisanUsername,
        WorkshopStatus status,
        String itemDescription,
        String metalType,
        String fineness,
        BigDecimal grossWeightGrams,
        String macroPhotoUrl,
        String svgDefectDiagram,
        Long estimatedQuoteCents,
        Long finalPriceCents,
        String customerNotes,
        Instant depositDate,
        Instant targetDeliveryDate,
        Instant actualDeliveryDate
) {
    public static RepairOrderResponse fromEntity(RepairOrder r) {
        return new RepairOrderResponse(
                r.getId(),
                r.getOrderNumber(),
                r.getStoreId(),
                r.getCustomerId(),
                r.getOperatorUsername(),
                r.getAssignedArtisanUsername(),
                r.getStatus(),
                r.getItemDescription(),
                r.getMetalType(),
                r.getFineness(),
                r.getGrossWeightGrams(),
                r.getMacroPhotoUrl(),
                r.getSvgDefectDiagram(),
                r.getEstimatedQuoteCents(),
                r.getFinalPriceCents(),
                r.getCustomerNotes(),
                r.getDepositDate(),
                r.getTargetDeliveryDate(),
                r.getActualDeliveryDate()
        );
    }
}
