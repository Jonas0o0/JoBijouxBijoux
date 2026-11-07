package fr.bijoux.erp.core.security.dto;

import fr.bijoux.erp.core.security.model.Role;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.util.Set;

public record CreateUserRequest(
        @NotBlank @Size(min = 3, max = 50)
        String username,

        @NotBlank @Size(min = 4, max = 100)
        String pinOrPassword,

        @NotBlank @Size(max = 80)
        String firstName,

        @NotBlank @Size(max = 80)
        String lastName,

        @Size(max = 120)
        String email,

        Long storeId,

        Set<Role> roles
) {
    public CreateUserRequest {
        if (roles == null || roles.isEmpty()) {
            roles = Set.of(Role.ROLE_VENDEUR);
        }
    }
}
