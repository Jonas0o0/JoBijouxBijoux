package fr.bijoux.erp.catalog.domain.model;

/**
 * Régimes fiscaux de TVA applicables en joaillerie (HBJO).
 */
public enum VatRegime {
    STANDARD_20("Régime de droit commun TVA à 20%"),
    REDUIT_5_5("Taux réduit TVA à 5.5%"),
    MARGE_OCCASION_ART_297A("Régime de la TVA sur marge - Biens d'occasion (Art. 297 A du CGI)"),
    EXONERE("Exonération de TVA");

    private final String description;

    VatRegime(String description) {
        this.description = description;
    }

    public String getDescription() {
        return description;
    }
}
