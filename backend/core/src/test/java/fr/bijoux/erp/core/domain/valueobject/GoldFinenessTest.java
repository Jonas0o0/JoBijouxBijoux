package fr.bijoux.erp.core.domain.valueobject;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;

import static org.assertj.core.api.Assertions.assertThat;

@DisplayName("Tests unitaires de l'énumération GoldFineness et calcul du métal fin")
class GoldFinenessTest {

    @Test
    @DisplayName("Doit calculer le poids d'or fin exact pour 10g d'Or 18K (750‰)")
    void shouldCalculateFineGoldFor18K() {
        WeightInGrams grossWeight = WeightInGrams.of("10.000");

        WeightInGrams fineGold = GoldFineness.OR_750.calculateFineWeight(grossWeight);

        // 10g * 750 / 1000 = 7.500g
        assertThat(fineGold.value()).isEqualByComparingTo(new BigDecimal("7.500"));
    }

    @Test
    @DisplayName("Doit calculer le poids fin pour de l'Or pur 999‰")
    void shouldCalculateFineGoldForPureGold() {
        WeightInGrams grossWeight = WeightInGrams.of("100.000");

        WeightInGrams fineGold = GoldFineness.OR_999.calculateFineWeight(grossWeight);

        // 100g * 999 / 1000 = 99.900g
        assertThat(fineGold.value()).isEqualByComparingTo(new BigDecimal("99.900"));
    }

    @Test
    @DisplayName("Doit calculer l'argent fin pour l'Argent 925‰ (Massif)")
    void shouldCalculateFineSilverForSterling() {
        WeightInGrams grossWeight = WeightInGrams.of("50.000");

        WeightInGrams fineSilver = GoldFineness.ARGENT_925.calculateFineWeight(grossWeight);

        // 50g * 925 / 1000 = 46.250g
        assertThat(fineSilver.value()).isEqualByComparingTo(new BigDecimal("46.250"));
    }

    @Test
    @DisplayName("Doit identifier les types de métaux légaux")
    void shouldMatchLegalMetalTypes() {
        assertThat(GoldFineness.OR_750.getMetalType()).isEqualTo(MetalType.OR);
        assertThat(GoldFineness.ARGENT_925.getMetalType()).isEqualTo(MetalType.ARGENT);
        assertThat(GoldFineness.PLATINE_950.getMetalType()).isEqualTo(MetalType.PLATINE);
        assertThat(GoldFineness.VERMEIL.getPartsPerThousand()).isEqualTo(925);
    }
}
