package fr.bijoux.erp.gold.domain.strategy;

import fr.bijoux.erp.gold.domain.model.GoldTaxRegime;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.math.RoundingMode;

/**
 * Taxe Forfaitaire sur les Métaux Précieux (TMP) - CGI art. 150 VI.
 * Taux global : 11.5% (11.0% taxe forfaitaire + 0.5% CRDS) assis sur le montant brut de la cession.
 */
@Component
public class TmpStrategy implements GoldTaxCalculationStrategy {

    private static final BigDecimal TMP_RATE = new BigDecimal("0.115"); // 11.5%

    @Override
    public GoldTaxRegime getRegime() {
        return GoldTaxRegime.TMP_11_5;
    }

    @Override
    public GoldTaxCalculationResult calculateTax(GoldTaxContext context) {
        if (context.grossAmountCents() <= 0) {
            return new GoldTaxCalculationResult(0L, 0L, BigDecimal.ZERO, "Montant nul ou négatif");
        }

        BigDecimal gross = BigDecimal.valueOf(context.grossAmountCents());
        BigDecimal tax = gross.multiply(TMP_RATE).setScale(0, RoundingMode.HALF_UP);
        long taxCents = tax.longValue();
        long netPayable = context.grossAmountCents() - taxCents;

        return new GoldTaxCalculationResult(
                taxCents,
                netPayable,
                new BigDecimal("11.50"),
                "Taxe forfaitaire TMP 11% + CRDS 0.5% (Art. 150 VI CGI)"
        );
    }
}
