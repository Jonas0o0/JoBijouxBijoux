package fr.bijoux.erp.gold.domain.strategy;

public record GoldTaxContext(
        long grossAmountCents,
        Long purchasePriceCents,
        Integer holdingYears,
        boolean proofOfAcquisitionAvailable
) {
    public static GoldTaxContext forTmp(long grossAmountCents) {
        return new GoldTaxContext(grossAmountCents, null, null, false);
    }

    public static GoldTaxContext forTpv(long grossAmountCents, long purchasePriceCents, int holdingYears) {
        return new GoldTaxContext(grossAmountCents, purchasePriceCents, holdingYears, true);
    }
}
