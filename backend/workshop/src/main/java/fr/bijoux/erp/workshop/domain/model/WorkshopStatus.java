package fr.bijoux.erp.workshop.domain.model;

/**
 * State Machine des fiches d'atelier (Réparations SAV et Créations sur-mesure).
 * Transition canonique : DEPOT -> DEVIS -> EN_COURS -> CONTROLE_QUALITE -> PRET_RETRAIT -> RESTITUE.
 */
public enum WorkshopStatus {
    DEPOT,
    DEVIS,
    EN_COURS,
    CONTROLE_QUALITE,
    PRET_RETRAIT,
    RESTITUE;

    public boolean canTransitionTo(WorkshopStatus next) {
        if (next == null || next == this) {
            return false;
        }

        return switch (this) {
            case DEPOT -> next == DEVIS || next == EN_COURS;
            case DEVIS -> next == EN_COURS || next == RESTITUE;
            case EN_COURS -> next == CONTROLE_QUALITE;
            case CONTROLE_QUALITE -> next == PRET_RETRAIT || next == EN_COURS; // Rejet qualité -> retour artisan
            case PRET_RETRAIT -> next == RESTITUE;
            case RESTITUE -> false; // État final
        };
    }
}
