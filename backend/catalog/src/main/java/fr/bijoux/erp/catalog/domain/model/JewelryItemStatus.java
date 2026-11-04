package fr.bijoux.erp.catalog.domain.model;

/**
 * Statuts d'un bijou unitaire sérialisé dans le cycle de vie du stock HBJO.
 */
public enum JewelryItemStatus {
    EN_STOCK("En stock magasin"),
    EN_VITRINE("Exposé en vitrine"),
    AU_COFFRE("Sécurisé au coffre-fort"),
    A_L_ATELIER("Transféré à l'atelier pour façonnage ou réparation"),
    CONCEDE("Confié en dépôt ou confié client"),
    VENDU("Vendu au client final"),
    REFONDU("Démonté et envoyé en refonte / compte-poids or fin");

    private final String description;

    JewelryItemStatus(String description) {
        this.description = description;
    }

    public String getDescription() {
        return description;
    }

    public boolean isAvailableForSale() {
        return this == EN_STOCK || this == EN_VITRINE || this == AU_COFFRE;
    }
}
