package fr.bijoux.erp.gold.domain.strategy;

import fr.bijoux.erp.gold.domain.model.GoldTaxRegime;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

@DisplayName("Tests Unitaires - Stratégies Fiscales Rachat d'Or (TMP 11.5% vs TPV 36.2%)")
class GoldTaxStrategyTest {

    private final TmpStrategy tmpStrategy = new TmpStrategy();
    private final TpvStrategy tpvStrategy = new TpvStrategy();
    private final GoldTaxStrategyRegistry registry = new GoldTaxStrategyRegistry(List.of(tmpStrategy, tpvStrategy));

    @Test
    @DisplayName("TMP (11.5%) : Doit calculer la taxe forfaitaire exacte de 11.5% sur le brut")
    void shouldCalculateTmp11Point5Percent() {
        // Rachat d'un lingot d'or pour 10 000,00 € brut (1 000 000 cents)
        // TMP = 10 000 * 11.5% = 1 150,00 € (115 000 cents)
        // Net payé = 8 850,00 € (885 000 cents)
        GoldTaxContext ctx = GoldTaxContext.forTmp(1_000_000L);
        GoldTaxCalculationResult res = registry.calculateTax(GoldTaxRegime.TMP_11_5, ctx);

        assertThat(res.taxAmountCents()).isEqualTo(115_000L);
        assertThat(res.netPayableCents()).isEqualTo(885_000L);
        assertThat(res.effectiveTaxRate()).isEqualByComparingTo(new BigDecimal("11.50"));
    }

    @Test
    @DisplayName("TPV : Doit exiger une facture ou preuve d'acquisition")
    void shouldRequireProofOfAcquisitionForTpv() {
        GoldTaxContext ctx = new GoldTaxContext(1_000_000L, 500_000L, 5, false);

        assertThatThrownBy(() -> registry.calculateTax(GoldTaxRegime.TPV_CAPITAL_GAIN, ctx))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("facture ou un acte d'acquisition");
    }

    @Test
    @DisplayName("TPV : Exonération totale d'impôt si détention >= 22 ans")
    void shouldExemptTpvAfter22Years() {
        // Acheté 5 000 €, revendu 10 000 € après 23 ans
        GoldTaxContext ctx = GoldTaxContext.forTpv(1_000_000L, 500_000L, 23);
        GoldTaxCalculationResult res = registry.calculateTax(GoldTaxRegime.TPV_CAPITAL_GAIN, ctx);

        assertThat(res.taxAmountCents()).isEqualTo(0L);
        assertThat(res.netPayableCents()).isEqualTo(1_000_000L);
        assertThat(res.details()).contains("Exonération totale pour durée de détention");
    }

    @Test
    @DisplayName("TPV : 0 € d'impôt en cas de moins-value ou gain nul")
    void shouldCalculateZeroTaxOnLoss() {
        // Acheté 12 000 €, revendu 10 000 € -> Perte
        GoldTaxContext ctx = GoldTaxContext.forTpv(1_000_000L, 1_200_000L, 1);
        GoldTaxCalculationResult res = registry.calculateTax(GoldTaxRegime.TPV_CAPITAL_GAIN, ctx);

        assertThat(res.taxAmountCents()).isEqualTo(0L);
        assertThat(res.netPayableCents()).isEqualTo(1_000_000L);
    }
}
