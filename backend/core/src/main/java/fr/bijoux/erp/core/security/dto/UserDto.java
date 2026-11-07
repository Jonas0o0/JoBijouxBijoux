package fr.bijoux.erp.core.security.dto;

import fr.bijoux.erp.core.security.model.Role;
import fr.bijoux.erp.core.security.model.User;

import java.time.Instant;
import java.util.Set;
import java.util.stream.Collectors;

public record UserDto(
        Long id,
        String username,
        String firstName,
        String lastName,
        String email,
        boolean active,
        Set<String> roles,
        Long storeId,
        String storeName,
        Instant createdAt
) {
    public static UserDto fromEntity(User user) {
        if (user == null) {
            return null;
        }
        return new UserDto(
                user.getId(),
                user.getUsername(),
                user.getFirstName(),
                user.getLastName(),
                user.getEmail(),
                user.isActive(),
                user.getRoles() != null
                        ? user.getRoles().stream().map(Role::name).collect(Collectors.toSet())
                        : Set.of(),
                user.getStore() != null ? user.getStore().getId() : null,
                user.getStore() != null ? user.getStore().getName() : null,
                user.getCreatedAt()
        );
    }
}
