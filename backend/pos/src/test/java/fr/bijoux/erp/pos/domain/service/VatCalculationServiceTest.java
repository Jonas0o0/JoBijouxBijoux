package fr.bijoux.erp.pos.domain.service;

import fr.bijoux.erp.catalog.domain.model.VatRegime;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;

import static org.assertj.core.api.Assertions.assertThat;

@DisplayName("Tests Unitaires - Calcul de TVA et Ventilation Fiscale")
class VatCalculationServiceTest {

    private final VatCalculationService vatService = new VatCalculationService();

    @Test
    @DisplayName("Doit calculer correctement la TVA à 20% (droit commun)")
    void shouldCalculateStandard20Vat() {
        // 120,00 € TTC = 100,00 € HT + 20,00 € TVA
        var result = vatService.calculateVat(12_000L, VatRegime.STANDARD_20, null);

        assertThat(result.totalHtCents()).isEqualTo(10_000L);
        assertThat(result.vatAmountCents()).isEqualTo(2_000L);
        assertThat(result.vatRate()).isEqualByComparingTo(new BigDecimal("20.00"));
    }

    @Test
    @DisplayName("Doit calculer correctement la TVA réduite à 5.5%")
    void shouldCalculateReduced55Vat() {
        // 105,50 € TTC = 100,00 € HT + 5,50 € TVA
        var result = vatService.calculateVat(10_550L, VatRegime.REDUIT_5_5, null);

        assertThat(result.totalHtCents()).isEqualTo(10_000L);
        assertThat(result.vatAmountCents()).isEqualTo(550L);
        assertThat(result.vatRate()).isEqualByComparingTo(new BigDecimal("5.50"));
    }

    @Test
    @DisplayName("Doit calculer la TVA sur la marge bénéficiaire (CGI art. 297 A)")
    void shouldCalculateVatOnMarginArt297A() {
        // Achat d'occasion à 500,00 € HT, revente à 800,00 € TTC
        // Marge brute TTC = 300,00 €
        // Marge HT = 300 / 1.20 = 250,00 € HT -> TVA sur marge = 50,00 €
        // HT déclaré = 800,00 - 50,00 = 750,00 €
        var result = vatService.calculateVat(80_000L, VatRegime.MARGE_OCCASION_ART_297A, 50_000L);

        assertThat(result.vatAmountCents()).isEqualTo(5_000L);
        assertThat(result.totalHtCents()).isEqualTo(75_000L);
    }

    @Test
    @DisplayName("Marge négative ou nulle sous CGI art. 297 A donne 0 € de TVA")
    void shouldCalculateZeroVatWhenNegativeMargin() {
        // Achat à 900,00 €, revente à 800,00 € -> Perte de 100 € -> Pas de TVA due
        var result = vatService.calculateVat(80_000L, VatRegime.MARGE_OCCASION_ART_297A, 90_000L);

        assertThat(result.vatAmountCents()).isEqualTo(0L);
        assertThat(result.totalHtCents()).isEqualTo(80_000L);
    }
}
