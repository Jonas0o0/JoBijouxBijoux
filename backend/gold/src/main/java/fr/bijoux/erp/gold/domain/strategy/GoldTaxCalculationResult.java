package fr.bijoux.erp.gold.domain.strategy;

import java.math.BigDecimal;

public record GoldTaxCalculationResult(
        long taxAmountCents,
        long netPayableCents,
        BigDecimal effectiveTaxRate,
        String details
) {}
