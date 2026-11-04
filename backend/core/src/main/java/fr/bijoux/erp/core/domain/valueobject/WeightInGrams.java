package fr.bijoux.erp.core.domain.valueobject;

import java.io.Serializable;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.Objects;

/**
 * Value Object immuable représentant un poids exprimé en grammes (g).
 * Conforme aux exigences de haute précision HBJO (centième et millième de gramme).
 * Tout calcul utilise l'arithmétique exacte BigDecimal avec arrondi HALF_UP.
 */
public record WeightInGrams(BigDecimal value) implements Comparable<WeightInGrams>, Serializable {

    public static final int SCALE = 3;
    public static final RoundingMode ROUNDING = RoundingMode.HALF_UP;

    public static final BigDecimal TROY_OUNCE_IN_GRAMS = new BigDecimal("31.1034768");
    public static final BigDecimal MILLIGRAM_FACTOR = new BigDecimal("1000");

    public static final WeightInGrams ZERO = new WeightInGrams(BigDecimal.ZERO.setScale(SCALE, ROUNDING));

    public WeightInGrams {
        Objects.requireNonNull(value, "Le poids en grammes ne peut pas être null");
        if (value.compareTo(BigDecimal.ZERO) < 0) {
            throw new IllegalArgumentException("Le poids en grammes ne peut pas être négatif : " + value);
        }
        value = value.setScale(SCALE, ROUNDING);
    }

    public static WeightInGrams of(BigDecimal grams) {
        return new WeightInGrams(grams);
    }

    public static WeightInGrams of(double grams) {
        return new WeightInGrams(BigDecimal.valueOf(grams));
    }

    public static WeightInGrams of(String grams) {
        return new WeightInGrams(new BigDecimal(grams));
    }

    public static WeightInGrams ofMilligrams(BigDecimal milligrams) {
        Objects.requireNonNull(milligrams, "Les milligrammes ne peuvent pas être null");
        return new WeightInGrams(milligrams.divide(MILLIGRAM_FACTOR, SCALE, ROUNDING));
    }

    public WeightInGrams add(WeightInGrams other) {
        Objects.requireNonNull(other, "L'autre poids ne peut pas être null");
        return new WeightInGrams(this.value.add(other.value));
    }

    public WeightInGrams subtract(WeightInGrams other) {
        Objects.requireNonNull(other, "L'autre poids ne peut pas être null");
        BigDecimal result = this.value.subtract(other.value);
        if (result.compareTo(BigDecimal.ZERO) < 0) {
            throw new IllegalArgumentException("La soustraction produit un poids négatif : " + result);
        }
        return new WeightInGrams(result);
    }

    public WeightInGrams multiply(BigDecimal factor) {
        Objects.requireNonNull(factor, "Le facteur ne peut pas être null");
        if (factor.compareTo(BigDecimal.ZERO) < 0) {
            throw new IllegalArgumentException("Le facteur multiplicateur ne peut pas être négatif : " + factor);
        }
        return new WeightInGrams(this.value.multiply(factor).setScale(SCALE, ROUNDING));
    }

    public WeightInGrams divide(BigDecimal divisor) {
        Objects.requireNonNull(divisor, "Le diviseur ne peut pas être null");
        if (divisor.compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalArgumentException("Le diviseur doit être strictement positif : " + divisor);
        }
        return new WeightInGrams(this.value.divide(divisor, SCALE, ROUNDING));
    }

    public BigDecimal toMilligrams() {
        return this.value.multiply(MILLIGRAM_FACTOR).setScale(0, ROUNDING);
    }

    public BigDecimal toTroyOunces() {
        return this.value.divide(TROY_OUNCE_IN_GRAMS, 6, ROUNDING);
    }

    @Override
    public int compareTo(WeightInGrams other) {
        return this.value.compareTo(other.value);
    }

    @Override
    public String toString() {
        return value.toPlainString() + " g";
    }
}
