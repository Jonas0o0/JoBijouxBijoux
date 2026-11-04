package fr.bijoux.erp.pos.domain.strategy;

import fr.bijoux.erp.pos.domain.model.PaymentMethod;

public record PaymentContext(
        PaymentMethod paymentMethod,
        long amountCents,
        Long cashReceivedCents,
        String tpeAuthToken,
        String voucherCode,
        Long scrapDossierId,
        Long customerId,
        Long storeId
) {
    public static PaymentContext of(PaymentMethod method, long amountCents) {
        return new PaymentContext(method, amountCents, null, null, null, null, null, null);
    }
}
