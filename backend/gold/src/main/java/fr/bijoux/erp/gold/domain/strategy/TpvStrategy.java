package fr.bijoux.erp.gold.domain.strategy;

import fr.bijoux.erp.gold.domain.model.GoldTaxRegime;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.math.RoundingMode;

/**
 * Taxe sur la Plus-Value Réelle (TPV) - CGI art. 150 VL.
 * Taux global : 36.2% (19% IR + 17.2% Prélèvements Sociaux).
 * Abattement : 5% par an de détention au-delà de la 2e année (exonération totale à 22 ans).
 */
@Component
public class TpvStrategy implements GoldTaxCalculationStrategy {

    private static final BigDecimal TPV_RATE = new BigDecimal("0.362"); // 36.2%

    @Override
    public GoldTaxRegime getRegime() {
        return GoldTaxRegime.TPV_CAPITAL_GAIN;
    }

    @Override
    public GoldTaxCalculationResult calculateTax(GoldTaxContext context) {
        if (!context.proofOfAcquisitionAvailable() || context.purchasePriceCents() == null) {
            throw new IllegalArgumentException("Le régime TPV exige obligatoirement une facture ou un acte d'acquisition justifiant le prix et la date");
        }

        if (context.grossAmountCents() <= 0) {
            return new GoldTaxCalculationResult(0L, 0L, BigDecimal.ZERO, "Montant brut nul");
        }

        long grossGainCents = Math.max(0L, context.grossAmountCents() - context.purchasePriceCents());
        if (grossGainCents == 0L) {
            // Moins-value ou plus-value nulle -> 0 € d'impôt
            return new GoldTaxCalculationResult(
                    0L,
                    context.grossAmountCents(),
                    BigDecimal.ZERO,
                    "Plus-value nulle ou négative (aucune imposition)"
            );
        }

        int years = context.holdingYears() != null ? Math.max(0, context.holdingYears()) : 0;
        int allowancePercent = 0;
        if (years >= 22) {
            allowancePercent = 100;
        } else if (years > 2) {
            allowancePercent = (years - 2) * 5;
        }

        if (allowancePercent >= 100) {
            return new GoldTaxCalculationResult(
                    0L,
                    context.grossAmountCents(),
                    BigDecimal.ZERO,
                    "Exonération totale pour durée de détention supérieure ou égale à 22 ans"
            );
        }

        BigDecimal taxableGain = BigDecimal.valueOf(grossGainCents)
                .multiply(BigDecimal.valueOf(100 - allowancePercent))
                .divide(new BigDecimal("100"), 2, RoundingMode.HALF_UP);

        BigDecimal tax = taxableGain.multiply(TPV_RATE).setScale(0, RoundingMode.HALF_UP);
        long taxCents = tax.longValue();
        long netPayable = context.grossAmountCents() - taxCents;

        BigDecimal effectiveRate = BigDecimal.valueOf(taxCents)
                .multiply(new BigDecimal("100"))
                .divide(BigDecimal.valueOf(context.grossAmountCents()), 2, RoundingMode.HALF_UP);

        return new GoldTaxCalculationResult(
                taxCents,
                netPayable,
                effectiveRate,
                String.format("TPV 36.2%% sur plus-value de %.2f € après abattement de %d%% (%d ans)",
                        grossGainCents / 100.0, allowancePercent, years)
        );
    }
}
