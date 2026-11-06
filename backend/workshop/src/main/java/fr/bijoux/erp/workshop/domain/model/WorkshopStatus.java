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
    RESTITUE,
    LIVRE_ET_FACTURE;

    public boolean canTransitionTo(WorkshopStatus next) {
        if (next == null || next == this) {
            return false;
        }

        return switch (this) {
            case DEPOT -> next == DEVIS || next == EN_COURS || next == LIVRE_ET_FACTURE;
            case DEVIS -> next == EN_COURS || next == RESTITUE || next == LIVRE_ET_FACTURE;
            case EN_COURS -> next == CONTROLE_QUALITE || next == LIVRE_ET_FACTURE;
            case CONTROLE_QUALITE -> next == PRET_RETRAIT || next == EN_COURS || next == LIVRE_ET_FACTURE; // Rejet qualité -> retour artisan
            case PRET_RETRAIT -> next == RESTITUE || next == LIVRE_ET_FACTURE;
            case RESTITUE -> next == LIVRE_ET_FACTURE;
            case LIVRE_ET_FACTURE -> false; // État final
        };
    }
}
