package fr.bijoux.erp.pos.domain.closure;

import java.util.Map;

public record ClosureAggregation(
        long totalTtcCents,
        long totalHtCents,
        long totalVatCents,
        Map<String, Long> vatBreakdown,
        Map<String, Long> paymentBreakdown,
        int ticketCount
) {}
