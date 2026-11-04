package fr.bijoux.erp.core.domain.valueobject;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.Objects;

/**
 * Énumération des titres légaux français pour les métaux précieux (Garantie HBJO).
 * Permet le calcul strict du poids en métal fin pur (or fin, argent fin, platine fin).
 */
public enum GoldFineness {

    OR_999(999, MetalType.OR, "Or pur 24K (999‰)"),
    OR_750(750, MetalType.OR, "Or 18K (750‰) - Titre légal standard joaillerie"),
    OR_585(585, MetalType.OR, "Or 14K (585‰)"),
    OR_375(375, MetalType.OR, "Or 9K (375‰)"),
    ARGENT_925(925, MetalType.ARGENT, "Argent 1er titre (925‰) - Argent massif / Sterling"),
    ARGENT_800(800, MetalType.ARGENT, "Argent 2e titre (800‰)"),
    PLATINE_950(950, MetalType.PLATINE, "Platine (950‰)"),
    VERMEIL(925, MetalType.ARGENT, "Vermeil légal (Argent 925‰ recouvert d'or 750‰)");

    private static final BigDecimal THOUSAND = new BigDecimal("1000");

    private final int partsPerThousand;
    private final MetalType metalType;
    private final String designation;

    GoldFineness(int partsPerThousand, MetalType metalType, String designation) {
        this.partsPerThousand = partsPerThousand;
        this.metalType = metalType;
        this.designation = designation;
    }

    public int getPartsPerThousand() {
        return partsPerThousand;
    }

    public MetalType getMetalType() {
        return metalType;
    }

    public String getDesignation() {
        return designation;
    }

    /**
     * Calcule le poids de métal fin (pur à 999‰/1000‰) contenu dans un alliage donné.
     * Poids Fin = Poids Brut * (Titre / 1000).
     *
     * @param totalWeight Poids brut de l'ouvrage ou de l'alliage
     * @return Poids en métal fin pur
     */
    public WeightInGrams calculateFineWeight(WeightInGrams totalWeight) {
        Objects.requireNonNull(totalWeight, "Le poids total ne peut pas être null");
        BigDecimal fineValue = totalWeight.value()
                .multiply(BigDecimal.valueOf(this.partsPerThousand))
                .divide(THOUSAND, WeightInGrams.SCALE, RoundingMode.HALF_UP);
        return WeightInGrams.of(fineValue);
    }
}
