package fr.bijoux.erp.core.audit.model;

/**
 * Types d'événements techniques de sécurité tracés dans le Journal des Événements Techniques (JET).
 * Conforme aux spécifications NF525.
 */
public enum SecurityEventType {
    LOGIN_SUCCESS("Connexion utilisateur réussie"),
    LOGIN_FAILURE("Échec d'authentification"),
    LOGOUT("Déconnexion utilisateur"),
    USER_CREATED("Création de compte utilisateur"),
    USER_ROLE_MODIFIED("Modification des droits d'accès / rôles"),
    USER_DISABLED("Désactivation de compte"),
    STORE_SWITCH("Changement de magasin actif"),
    POLICE_BOOK_ACCESS("Accès en consultation ou export au Livre de Police"),
    FISCAL_SEAL_VERIFIED("Vérification d'intégrité de la chaîne fiscale"),
    INTEGRITY_BREACH_DETECTED("Alerte anomalie ou rupture de chaîne cryptographique");

    private final String description;

    SecurityEventType(String description) {
        this.description = description;
    }

    public String getDescription() {
        return description;
    }
}
