package fr.bijoux.erp.catalog.domain.model;

/**
 * Régimes fiscaux de TVA applicables en joaillerie (HBJO).
 */
public enum VatRegime {
    STANDARD_20("Régime de droit commun TVA à 20%"),
    MARGE_OCCASION_ART_297A("Régime de la TVA sur marge - Biens d'occasion (Art. 297 A du CGI)");

    private final String description;

    VatRegime(String description) {
        this.description = description;
    }

    public String getDescription() {
        return description;
    }
}
