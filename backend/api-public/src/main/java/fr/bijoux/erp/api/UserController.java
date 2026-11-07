package fr.bijoux.erp.api;

import fr.bijoux.erp.core.security.dto.CreateUserRequest;
import fr.bijoux.erp.core.security.dto.UpdateRolesRequest;
import fr.bijoux.erp.core.security.dto.UserDto;
import fr.bijoux.erp.core.security.service.UserService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Contrôleur REST pour la gestion du personnel, des vendeuses et des habilitations de boutique.
 */
@RestController
@RequestMapping("/api/v1/users")
public class UserController {

    private final UserService userService;

    public UserController(UserService userService) {
        this.userService = userService;
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'GERANT')")
    public ResponseEntity<UserDto> createUser(@Valid @RequestBody CreateUserRequest request) {
        UserDto created = userService.createUser(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @GetMapping
    public ResponseEntity<List<UserDto>> listUsers(@RequestParam(required = false) Long storeId) {
        List<UserDto> users = userService.findUsersByStore(storeId);
        return ResponseEntity.ok(users);
    }

    @GetMapping("/{username}")
    public ResponseEntity<UserDto> getUserByUsername(@PathVariable String username) {
        return userService.findByUsername(username)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PatchMapping("/{id}/roles")
    @PreAuthorize("hasAnyRole('ADMIN', 'GERANT')")
    public ResponseEntity<UserDto> updateUserRoles(@PathVariable Long id, @Valid @RequestBody UpdateRolesRequest request) {
        UserDto updated = userService.updateRoles(id, request.roles());
        return ResponseEntity.ok(updated);
    }

    @PatchMapping("/{id}/toggle-active")
    @PreAuthorize("hasAnyRole('ADMIN', 'GERANT')")
    public ResponseEntity<UserDto> toggleUserActive(@PathVariable Long id, @RequestParam boolean active) {
        UserDto updated = userService.toggleActive(id, active);
        return ResponseEntity.ok(updated);
    }
}
