package fr.bijoux.erp.catalog.domain.model;

/**
 * Types d'emplacements de stockage physique au sein d'une boutique HBJO.
 */
public enum StorageLocationType {
    COFFRE_FORT("Coffre-fort principal blindé"),
    VITRINE("Vitrine d'exposition commerciale"),
    PLATEAU("Plateau de présentation ou de rangement"),
    TIROIR_SAV("Tiroir sécurisé SAV / Réparations"),
    ATELIER("Atelier de bijouterie / horlogerie");

    private final String description;

    StorageLocationType(String description) {
        this.description = description;
    }

    public String getDescription() {
        return description;
    }
}
