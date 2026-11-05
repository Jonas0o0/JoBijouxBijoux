package fr.bijoux.erp.gold.domain.strategy;

import fr.bijoux.erp.gold.domain.model.GoldTaxRegime;

/**
 * Strategy Pattern pour le calcul fiscal lors du rachat de métaux précieux.
 */
public interface GoldTaxCalculationStrategy {

    GoldTaxRegime getRegime();

    GoldTaxCalculationResult calculateTax(GoldTaxContext context);
}
