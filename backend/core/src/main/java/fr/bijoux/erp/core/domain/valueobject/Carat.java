package fr.bijoux.erp.core.domain.valueobject;

import java.io.Serializable;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.Objects;

/**
 * Value Object immuable représentant le poids d'une gemme en carats métriques (ct).
 * 1 carat = 0.200 gramme (200 milligrammes).
 * Précision minimale au centième / millième de carat.
 */
public record Carat(BigDecimal value) implements Comparable<Carat>, Serializable {

    public static final int SCALE = 3;
    public static final RoundingMode ROUNDING = RoundingMode.HALF_UP;

    public static final BigDecimal CARAT_TO_GRAM_FACTOR = new BigDecimal("0.20");
    public static final BigDecimal GRAM_TO_CARAT_FACTOR = new BigDecimal("5.0");

    public static final Carat ZERO = new Carat(BigDecimal.ZERO.setScale(SCALE, ROUNDING));

    public Carat {
        Objects.requireNonNull(value, "Le poids en carats ne peut pas être null");
        if (value.compareTo(BigDecimal.ZERO) < 0) {
            throw new IllegalArgumentException("Le poids en carats ne peut pas être négatif : " + value);
        }
        value = value.setScale(SCALE, ROUNDING);
    }

    public static Carat of(BigDecimal carats) {
        return new Carat(carats);
    }

    public static Carat of(double carats) {
        return new Carat(BigDecimal.valueOf(carats));
    }

    public static Carat of(String carats) {
        return new Carat(new BigDecimal(carats));
    }

    public static Carat fromWeightInGrams(WeightInGrams weight) {
        Objects.requireNonNull(weight, "Le poids en grammes ne peut pas être null");
        return new Carat(weight.value().multiply(GRAM_TO_CARAT_FACTOR).setScale(SCALE, ROUNDING));
    }

    public WeightInGrams toWeightInGrams() {
        return WeightInGrams.of(this.value.multiply(CARAT_TO_GRAM_FACTOR).setScale(WeightInGrams.SCALE, ROUNDING));
    }

    public Carat add(Carat other) {
        Objects.requireNonNull(other, "L'autre carat ne peut pas être null");
        return new Carat(this.value.add(other.value));
    }

    public Carat subtract(Carat other) {
        Objects.requireNonNull(other, "L'autre carat ne peut pas être null");
        BigDecimal result = this.value.subtract(other.value);
        if (result.compareTo(BigDecimal.ZERO) < 0) {
            throw new IllegalArgumentException("La soustraction produit un carat négatif : " + result);
        }
        return new Carat(result);
    }

    public Carat multiply(BigDecimal factor) {
        Objects.requireNonNull(factor, "Le facteur multiplicateur ne peut pas être null");
        if (factor.compareTo(BigDecimal.ZERO) < 0) {
            throw new IllegalArgumentException("Le facteur multiplicateur ne peut pas être négatif : " + factor);
        }
        return new Carat(this.value.multiply(factor).setScale(SCALE, ROUNDING));
    }

    @Override
    public int compareTo(Carat other) {
        return this.value.compareTo(other.value);
    }

    @Override
    public String toString() {
        return value.toPlainString() + " ct";
    }
}
