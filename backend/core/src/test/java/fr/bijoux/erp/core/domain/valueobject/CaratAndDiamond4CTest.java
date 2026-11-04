package fr.bijoux.erp.core.domain.valueobject;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;

import static org.assertj.core.api.Assertions.assertThat;

@DisplayName("Tests unitaires de Carat et Diamond4C")
class CaratAndDiamond4CTest {

    @Test
    @DisplayName("Doit convertir 1 carat en 0.200 gramme et vice versa")
    void shouldConvertCaratToGramAndBack() {
        Carat oneCarat = Carat.of(1.0);
        WeightInGrams weight = oneCarat.toWeightInGrams();

        // 1 ct = 0.200 g
        assertThat(weight.value()).isEqualByComparingTo(new BigDecimal("0.200"));

        Carat backToCarat = Carat.fromWeightInGrams(weight);
        assertThat(backToCarat.value()).isEqualByComparingTo(new BigDecimal("1.000"));
    }

    @Test
    @DisplayName("Doit créer une fiche diamant 4C complète et immuable")
    void shouldCreateDiamond4C() {
        Diamond4C diamond = Diamond4C.builder()
                .carat(Carat.of("1.500"))
                .color(DiamondColor.D)
                .clarity(DiamondClarity.VVS1)
                .cut(DiamondCut.EXCELLENT)
                .polish(PolishGrade.EXCELLENT)
                .symmetry(SymmetryGrade.EXCELLENT)
                .fluorescence(Fluorescence.NONE)
                .certificateLab(CertificateLab.GIA)
                .certificateNumber("GIA-1234567890")
                .laserInscription("GIA 1234567890")
                .build();

        assertThat(diamond.carat().value()).isEqualByComparingTo(new BigDecimal("1.500"));
        assertThat(diamond.color()).isEqualTo(DiamondColor.D);
        assertThat(diamond.clarity()).isEqualTo(DiamondClarity.VVS1);
        assertThat(diamond.cut()).isEqualTo(DiamondCut.EXCELLENT);
        assertThat(diamond.certificateLab()).isEqualTo(CertificateLab.GIA);
        assertThat(diamond.laserInscription()).isEqualTo("GIA 1234567890");
    }
}
