package fr.bijoux.erp.gold.dto;

import java.math.BigDecimal;

public record GoldEstimateResponse(
        BigDecimal totalGrossWeightGrams,
        BigDecimal totalEstimatedNetWeightGrams,
        long totalGrossAmountCents,
        long taxAmountCents,
        long netPayableCents,
        String taxStrategy,
        String taxDetails
) {}
