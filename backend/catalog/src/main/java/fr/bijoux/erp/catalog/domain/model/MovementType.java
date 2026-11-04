package fr.bijoux.erp.catalog.domain.model;

/**
 * Type de mouvement unitaire de stock.
 */
public enum MovementType {
    ENTREE_STOCK("Entrée initiale en stock (achat, création ou reprise)"),
    TRANSFERT_EMPLACEMENT("Déplacement interne d'emplacement"),
    DEPOT_ATELIER("Transfert vers l'atelier de façonnage"),
    RETOUR_SAV("Retour d'atelier / SAV"),
    SORTIE_VENTE("Sortie définitive pour vente"),
    REFONTE("Destruction et sortie pour refonte");

    private final String description;

    MovementType(String description) {
        this.description = description;
    }

    public String getDescription() {
        return description;
    }
}
