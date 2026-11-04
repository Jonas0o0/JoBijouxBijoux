package fr.bijoux.erp.pos.domain.service;

import fr.bijoux.erp.catalog.domain.model.VatRegime;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;

/**
 * Service dédié au calcul et à la ventilation fiscale de la TVA (Single Responsibility Principle).
 * Gère les régimes à 20%, 5.5% et le Régime de la Marge HBJO (CGI art. 297 A).
 */
@Service
public class VatCalculationService {

    public record VatCalculationResult(
            long totalHtCents,
            long vatAmountCents,
            BigDecimal vatRate
    ) {}

    public VatCalculationResult calculateVat(long totalTtcCents, VatRegime regime, Long purchasePriceHtCents) {
        if (totalTtcCents <= 0) {
            return new VatCalculationResult(0L, 0L, BigDecimal.ZERO);
        }

        return switch (regime) {
            case STANDARD_20 -> {
                BigDecimal ttc = BigDecimal.valueOf(totalTtcCents);
                BigDecimal divisor = new BigDecimal("1.20");
                BigDecimal ht = ttc.divide(divisor, 0, RoundingMode.HALF_UP);
                long htCents = ht.longValue();
                long vatCents = totalTtcCents - htCents;
                yield new VatCalculationResult(htCents, vatCents, new BigDecimal("20.00"));
            }
            case REDUIT_5_5 -> {
                BigDecimal ttc = BigDecimal.valueOf(totalTtcCents);
                BigDecimal divisor = new BigDecimal("1.055");
                BigDecimal ht = ttc.divide(divisor, 0, RoundingMode.HALF_UP);
                long htCents = ht.longValue();
                long vatCents = totalTtcCents - htCents;
                yield new VatCalculationResult(htCents, vatCents, new BigDecimal("5.50"));
            }
            case MARGE_OCCASION_ART_297A -> {
                // Article 297 A du CGI : TVA assise uniquement sur la marge brute réalisée
                long purchasePrice = (purchasePriceHtCents != null) ? purchasePriceHtCents : 0L;
                long grossMarginCents = Math.max(0L, totalTtcCents - purchasePrice);

                BigDecimal marginTtc = BigDecimal.valueOf(grossMarginCents);
                BigDecimal marginHt = marginTtc.divide(new BigDecimal("1.20"), 0, RoundingMode.HALF_UP);
                long vatCents = grossMarginCents - marginHt.longValue();
                long htCents = totalTtcCents - vatCents;
                yield new VatCalculationResult(htCents, vatCents, new BigDecimal("20.00"));
            }
            case EXONERE -> new VatCalculationResult(totalTtcCents, 0L, BigDecimal.ZERO);
        };
    }
}
