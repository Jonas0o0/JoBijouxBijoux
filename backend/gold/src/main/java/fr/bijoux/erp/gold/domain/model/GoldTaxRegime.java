package fr.bijoux.erp.gold.domain.model;

/**
 * Régimes fiscaux applicables au rachat d'or et métaux précieux (CGI art. 150 VI & 150 VL).
 */
public enum GoldTaxRegime {
    TMP_11_5("Taxe forfaitaire sur les métaux précieux (11.5% : 11% TMP + 0.5% CRDS)"),
    TPV_CAPITAL_GAIN("Régime de la plus-value réelle avec justificatif (36.2% avec abattement)");

    private final String description;

    GoldTaxRegime(String description) {
        this.description = description;
    }

    public String getDescription() {
        return description;
    }
}
