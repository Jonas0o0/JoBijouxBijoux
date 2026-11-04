package fr.bijoux.erp.core.domain.valueobject;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.util.Currency;

import static org.assertj.core.api.Assertions.*;

@DisplayName("Tests unitaires du Value Object MoneyAmount (Calcul financier sans flottant)")
class MoneyAmountTest {

    @Test
    @DisplayName("Doit créer un montant en centimes entiers et convertir en BigDecimal")
    void shouldCreateMoneyAmountFromCentsAndEuros() {
        MoneyAmount m1 = MoneyAmount.ofCents(12990); // 129.90 €
        assertThat(m1.toBigDecimal()).isEqualByComparingTo(new BigDecimal("129.90"));

        MoneyAmount m2 = MoneyAmount.ofEuros(new BigDecimal("129.90"));
        assertThat(m2.cents()).isEqualTo(12990L);
    }

    @Test
    @DisplayName("Doit additionner et soustraire deux montants monétaires")
    void shouldAddAndSubtractMoney() {
        MoneyAmount itemPrice = MoneyAmount.ofCents(5000); // 50.00 €
        MoneyAmount discount = MoneyAmount.ofCents(1000);  // 10.00 €

        MoneyAmount total = itemPrice.add(discount);
        assertThat(total.cents()).isEqualTo(6000L);

        MoneyAmount net = itemPrice.subtract(discount);
        assertThat(net.cents()).isEqualTo(4000L);
    }

    @Test
    @DisplayName("Doit calculer un pourcentage (ex: TVA 20%)")
    void shouldCalculatePercentage() {
        MoneyAmount ht = MoneyAmount.ofCents(10000); // 100.00 € HT
        MoneyAmount tva = ht.percentage(new BigDecimal("20.0")); // 20% TVA

        assertThat(tva.cents()).isEqualTo(2000L);
        assertThat(ht.add(tva).cents()).isEqualTo(12000L); // 120.00 € TTC
    }

    @Test
    @DisplayName("Doit refuser les opérations entre devises différentes")
    void shouldRejectMixedCurrencies() {
        MoneyAmount euros = MoneyAmount.ofCents(1000, Currency.getInstance("EUR"));
        MoneyAmount usd = MoneyAmount.ofCents(1000, Currency.getInstance("USD"));

        assertThatThrownBy(() -> euros.add(usd))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Impossible d'effectuer une opération entre devises distinctes");
    }
}
