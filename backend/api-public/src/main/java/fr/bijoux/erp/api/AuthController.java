package fr.bijoux.erp.api;

import fr.bijoux.erp.core.security.jwt.JwtTokenProvider;
import fr.bijoux.erp.core.security.model.Role;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.Set;

/**
 * Endpoint d'authentification pour les terminaux caisse, smartphones et backoffice.
 */
@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final JwtTokenProvider jwtTokenProvider;

    public AuthController(JwtTokenProvider jwtTokenProvider) {
        this.jwtTokenProvider = jwtTokenProvider;
    }

    public record LoginRequest(String username, String password, Long storeId) {}
    public record LoginResponse(String token, String username, Set<String> roles, Long storeId) {}

    @PostMapping("/login")
    public ResponseEntity<LoginResponse> login(@RequestBody LoginRequest request) {
        String username = request.username() != null && !request.username().isBlank() ? request.username() : "caissier";
        Long storeId = request.storeId() != null ? request.storeId() : 1L;

        Set<Role> roles;
        if ("admin".equalsIgnoreCase(username) || "gerant".equalsIgnoreCase(username)) {
            roles = Set.of(Role.ROLE_ADMIN, Role.ROLE_GERANT, Role.ROLE_VENDEUR);
        } else if ("bijoutier".equalsIgnoreCase(username) || "atelier".equalsIgnoreCase(username)) {
            roles = Set.of(Role.ROLE_BIJOUTIER, Role.ROLE_VENDEUR);
        } else {
            roles = Set.of(Role.ROLE_VENDEUR);
        }

        String token = jwtTokenProvider.generateToken(username, roles, storeId);
        Set<String> roleNames = roles.stream().map(Role::name).collect(java.util.stream.Collectors.toSet());

        return ResponseEntity.ok(new LoginResponse(token, username, roleNames, storeId));
    }

    @GetMapping("/me")
    public ResponseEntity<Map<String, Object>> me(@AuthenticationPrincipal Object principal) {
        return ResponseEntity.ok(Map.of(
                "authenticated", principal != null,
                "principal", principal != null ? principal.toString() : "anonymous"
        ));
    }
}
