package fr.bijoux.erp.core.domain.valueobject;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.math.RoundingMode;

import static org.assertj.core.api.Assertions.*;

@DisplayName("Tests unitaires du Value Object WeightInGrams")
class WeightInGramsTest {

    @Test
    @DisplayName("Doit créer un poids valide et arrondir au millième par défaut")
    void shouldCreateValidWeight() {
        WeightInGrams weight = WeightInGrams.of(12.3456);
        assertThat(weight.value()).isEqualByComparingTo(new BigDecimal("12.346"));
    }

    @Test
    @DisplayName("Doit refuser un poids négatif ou null")
    void shouldRejectNegativeOrNullWeight() {
        assertThatThrownBy(() -> WeightInGrams.of(-0.01))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("négatif");

        assertThatThrownBy(() -> new WeightInGrams(null))
                .isInstanceOf(NullPointerException.class);
    }

    @Test
    @DisplayName("Doit additionner et soustraire avec précision exacte")
    void shouldAddAndSubtractAccurately() {
        WeightInGrams w1 = WeightInGrams.of("10.500");
        WeightInGrams w2 = WeightInGrams.of("2.250");

        WeightInGrams sum = w1.add(w2);
        assertThat(sum.value()).isEqualByComparingTo(new BigDecimal("12.750"));

        WeightInGrams diff = w1.subtract(w2);
        assertThat(diff.value()).isEqualByComparingTo(new BigDecimal("8.250"));
    }

    @Test
    @DisplayName("Doit interdire une soustraction produisant un poids négatif")
    void shouldRejectSubtractionYieldingNegative() {
        WeightInGrams w1 = WeightInGrams.of("2.000");
        WeightInGrams w2 = WeightInGrams.of("5.000");

        assertThatThrownBy(() -> w1.subtract(w2))
                .isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    @DisplayName("Doit convertir correctement en milligrammes et en onces troy")
    void shouldConvertToMilligramsAndTroyOunces() {
        WeightInGrams weight = WeightInGrams.of("31.103");

        // 31.103 g = 31103 mg
        assertThat(weight.toMilligrams()).isEqualByComparingTo(new BigDecimal("31103"));

        // ~ 1 once troy (31.1034768 g)
        BigDecimal troyOunces = weight.toTroyOunces();
        assertThat(troyOunces).isCloseTo(BigDecimal.ONE, within(new BigDecimal("0.001")));
    }
}
