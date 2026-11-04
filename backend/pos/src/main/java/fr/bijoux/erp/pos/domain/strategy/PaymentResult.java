package fr.bijoux.erp.pos.domain.strategy;

public record PaymentResult(
        boolean success,
        String transactionReference,
        Long changeGivenCents,
        String errorMessage
) {
    public static PaymentResult success(String transactionReference, Long changeGivenCents) {
        return new PaymentResult(true, transactionReference, changeGivenCents != null ? changeGivenCents : 0L, null);
    }

    public static PaymentResult failure(String errorMessage) {
        return new PaymentResult(false, null, 0L, errorMessage);
    }
}
