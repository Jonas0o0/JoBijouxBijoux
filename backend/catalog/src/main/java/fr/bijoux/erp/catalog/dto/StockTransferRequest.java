package fr.bijoux.erp.catalog.dto;

import jakarta.validation.constraints.NotNull;

public record StockTransferRequest(
        @NotNull Long targetStoreId,
        Long targetLocationId,
        String carrier,
        String transferSlipNumber,
        String performedBy,
        String notes
) {
}
