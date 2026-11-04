package fr.bijoux.erp.core.security.model;

import org.springframework.security.core.GrantedAuthority;

/**
 * Rôles d'habilitation métier pour la bijouterie-joaillerie HBJO.
 */
public enum Role implements GrantedAuthority {
    ROLE_VENDEUR("Vendeur en boutique"),
    ROLE_GERANT("Gérant de magasin / Responsable de point de vente"),
    ROLE_BIJOUTIER("Bijoutier / Horloger d'Atelier"),
    ROLE_ADMIN("Administrateur Général ERP");

    private final String description;

    Role(String description) {
        this.description = description;
    }

    public String getDescription() {
        return description;
    }

    @Override
    public String getAuthority() {
        return name();
    }
}
