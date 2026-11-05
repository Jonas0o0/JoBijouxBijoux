package fr.bijoux.erp.weightaccount.dto;

import java.math.BigDecimal;
import java.time.Instant;

public record WeightAccountBalanceDto(
        Long storeId,
        String partnerName,
        String partnerType,
        String metalType,
        BigDecimal balanceGrams,
        Instant lastUpdated
) {}
