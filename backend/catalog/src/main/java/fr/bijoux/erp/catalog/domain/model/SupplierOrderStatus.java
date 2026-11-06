package fr.bijoux.erp.catalog.domain.model;

/**
 * Statuts d'une commande d'achat fournisseur en joaillerie.
 */
public enum SupplierOrderStatus {
    BROUILLON("Brouillon de commande"),
    COMMANDE("Commande transmise au fournisseur"),
    PARTIEL("Réception partielle de la marchandise"),
    RECEPTIONNE("Marchandise entièrement réceptionnée et entrée en stock");

    private final String description;

    SupplierOrderStatus(String description) {
        this.description = description;
    }

    public String getDescription() {
        return description;
    }
}
