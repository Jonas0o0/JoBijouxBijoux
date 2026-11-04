package fr.bijoux.erp.core.domain.valueobject;

import java.io.Serializable;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.Currency;
import java.util.Objects;

/**
 * Value Object immuable représentant un montant monétaire en centimes entiers.
 * Évite rigoureusement toute imprécision liée aux nombres flottants IEEE 754.
 * Devise standard par défaut : EUR (€).
 */
public record MoneyAmount(long cents, Currency currency) implements Comparable<MoneyAmount>, Serializable {

    public static final Currency EUR = Currency.getInstance("EUR");
    public static final MoneyAmount ZERO_EUR = new MoneyAmount(0L, EUR);

    public MoneyAmount {
        Objects.requireNonNull(currency, "La devise ne peut pas être null");
    }

    public static MoneyAmount ofCents(long cents) {
        return new MoneyAmount(cents, EUR);
    }

    public static MoneyAmount ofCents(long cents, Currency currency) {
        return new MoneyAmount(cents, currency);
    }

    public static MoneyAmount ofEuros(BigDecimal euros) {
        Objects.requireNonNull(euros, "Le montant en euros ne peut pas être null");
        long centsValue = euros.multiply(BigDecimal.valueOf(100)).setScale(0, RoundingMode.HALF_UP).longValueExact();
        return new MoneyAmount(centsValue, EUR);
    }

    public static MoneyAmount ofEuros(double euros) {
        return ofEuros(BigDecimal.valueOf(euros));
    }

    public MoneyAmount add(MoneyAmount other) {
        validateSameCurrency(other);
        return new MoneyAmount(Math.addExact(this.cents, other.cents), this.currency);
    }

    public MoneyAmount subtract(MoneyAmount other) {
        validateSameCurrency(other);
        return new MoneyAmount(Math.subtractExact(this.cents, other.cents), this.currency);
    }

    public MoneyAmount multiply(BigDecimal factor) {
        return multiply(factor, RoundingMode.HALF_UP);
    }

    public MoneyAmount multiply(BigDecimal factor, RoundingMode roundingMode) {
        Objects.requireNonNull(factor, "Le facteur ne peut pas être null");
        Objects.requireNonNull(roundingMode, "Le mode d'arrondi ne peut pas être null");
        BigDecimal result = BigDecimal.valueOf(this.cents).multiply(factor).setScale(0, roundingMode);
        return new MoneyAmount(result.longValueExact(), this.currency);
    }

    public MoneyAmount percentage(BigDecimal percentageRate) {
        Objects.requireNonNull(percentageRate, "Le taux de pourcentage ne peut pas être null");
        BigDecimal factor = percentageRate.divide(BigDecimal.valueOf(100), 6, RoundingMode.HALF_UP);
        return multiply(factor, RoundingMode.HALF_UP);
    }

    public BigDecimal toBigDecimal() {
        return BigDecimal.valueOf(this.cents).divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);
    }

    public boolean isPositive() {
        return this.cents > 0L;
    }

    public boolean isZero() {
        return this.cents == 0L;
    }

    public boolean isNegative() {
        return this.cents < 0L;
    }

    private void validateSameCurrency(MoneyAmount other) {
        Objects.requireNonNull(other, "L'autre montant ne peut pas être null");
        if (!this.currency.equals(other.currency)) {
            throw new IllegalArgumentException("Impossible d'effectuer une opération entre devises distinctes : "
                    + this.currency + " et " + other.currency);
        }
    }

    @Override
    public int compareTo(MoneyAmount other) {
        validateSameCurrency(other);
        return Long.compare(this.cents, other.cents);
    }

    @Override
    public String toString() {
        return toBigDecimal().toPlainString() + " " + currency.getCurrencyCode();
    }
}
