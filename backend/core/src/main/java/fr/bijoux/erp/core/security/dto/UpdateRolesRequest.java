package fr.bijoux.erp.core.security.dto;

import fr.bijoux.erp.core.security.model.Role;
import jakarta.validation.constraints.NotEmpty;

import java.util.Set;

/**
 * Requête de modification des rôles et habilitations d'un collaborateur HBJO.
 */
public record UpdateRolesRequest(
        @NotEmpty(message = "Au moins un rôle doit être spécifié")
        Set<Role> roles
) {
}
