package fr.bijoux.erp.pos.dto;

import java.util.List;

public record CartValidationResult(
        boolean valid,
        long totalTtcCents,
        long totalHtCents,
        long totalVatCents,
        List<String> errors
) {
    public static CartValidationResult ok(long totalTtcCents, long totalHtCents, long totalVatCents) {
        return new CartValidationResult(true, totalTtcCents, totalHtCents, totalVatCents, List.of());
    }

    public static CartValidationResult invalid(List<String> errors) {
        return new CartValidationResult(false, 0L, 0L, 0L, errors);
    }
}
