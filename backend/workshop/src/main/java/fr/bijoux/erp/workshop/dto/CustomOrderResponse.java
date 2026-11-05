package fr.bijoux.erp.workshop.dto;

import fr.bijoux.erp.workshop.domain.model.CustomManufacturingOrder;
import fr.bijoux.erp.workshop.domain.model.WorkshopStatus;

import java.math.BigDecimal;
import java.time.Instant;

public record CustomOrderResponse(
        Long id,
        String orderNumber,
        Long storeId,
        Long customerId,
        String operatorUsername,
        String assignedArtisanUsername,
        WorkshopStatus status,
        String title,
        String description,
        BigDecimal estimatedGoldWeightGrams,
        BigDecimal fireLossPercentage,
        BigDecimal finalWeightGrams,
        Long quotePriceCents,
        Instant createdAt
) {
    public static CustomOrderResponse fromEntity(CustomManufacturingOrder c) {
        return new CustomOrderResponse(
                c.getId(),
                c.getOrderNumber(),
                c.getStoreId(),
                c.getCustomerId(),
                c.getOperatorUsername(),
                c.getAssignedArtisanUsername(),
                c.getStatus(),
                c.getTitle(),
                c.getDescription(),
                c.getEstimatedGoldWeightGrams(),
                c.getFireLossPercentage(),
                c.getFinalWeightGrams(),
                c.getQuotePriceCents(),
                c.getCreatedAt()
        );
    }
}
