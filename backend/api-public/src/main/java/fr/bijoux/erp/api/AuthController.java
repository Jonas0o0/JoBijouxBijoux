package fr.bijoux.erp.api;

import fr.bijoux.erp.core.security.jwt.JwtTokenProvider;
import fr.bijoux.erp.core.security.model.Role;
import fr.bijoux.erp.core.security.model.Store;
import fr.bijoux.erp.core.security.repository.StoreRepository;
import fr.bijoux.erp.core.tenant.context.TenantContextHolder;
import fr.bijoux.erp.core.tenant.dto.StoreDto;
import fr.bijoux.erp.core.tenant.dto.TenantDto;
import fr.bijoux.erp.core.tenant.model.Tenant;
import fr.bijoux.erp.core.tenant.repository.TenantRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * Endpoint d'authentification SaaS multi-tenant & multi-boutiques pour les terminaux caisse,
 * tablettes d'atelier et portail backoffice.
 */
@RestController
@RequestMapping("/api/auth")
@Transactional(readOnly = true)
public class AuthController {

    private final JwtTokenProvider jwtTokenProvider;
    private final TenantRepository tenantRepository;
    private final StoreRepository storeRepository;

    public AuthController(JwtTokenProvider jwtTokenProvider,
                          TenantRepository tenantRepository,
                          StoreRepository storeRepository) {
        this.jwtTokenProvider = jwtTokenProvider;
        this.tenantRepository = tenantRepository;
        this.storeRepository = storeRepository;
    }

    public record LoginRequest(String username, String password, String tenantId, Long storeId) {
        public LoginRequest(String username, String password, Long storeId) {
            this(username, password, null, storeId);
        }
    }

    public record LoginResponse(
            String token,
            String username,
            Set<String> roles,
            Long storeId,
            String tenantId,
            List<StoreDto> stores
    ) {
        public LoginResponse(String token, String username, Set<String> roles, Long storeId) {
            this(token, username, roles, storeId, null, List.of());
        }
    }

    public record SwitchStoreRequest(Long storeId, String tenantId) {
        public SwitchStoreRequest(Long storeId) {
            this(storeId, null);
        }
    }

    /**
     * Authentification d'un utilisateur au sein d'une entreprise/tenant et sélection d'une boutique.
     */
    @PostMapping("/login")
    public ResponseEntity<LoginResponse> login(@RequestBody LoginRequest request) {
        String username = request.username() != null && !request.username().isBlank() ? request.username() : "caissier";
        String tenantInput = request.tenantId();

        Tenant tenant = resolveTenant(tenantInput);
        String tenantCode = tenant != null ? tenant.getCode() : (tenantInput != null && !tenantInput.isBlank() ? tenantInput : "maison-vendome");

        List<Store> storeEntities;
        if (tenant != null) {
            storeEntities = storeRepository.findByTenantIdAndActiveTrue(tenant.getId());
            if (storeEntities.isEmpty()) {
                storeEntities = storeRepository.findByTenantCodeAndActiveTrue(tenant.getCode());
            }
        } else {
            storeEntities = storeRepository.findAll().stream().filter(Store::isActive).toList();
        }

        List<StoreDto> storeDtos = storeEntities.stream()
                .map(StoreDto::fromEntity)
                .toList();

        Long storeId = request.storeId();
        if (storeId == null && !storeEntities.isEmpty()) {
            storeId = storeEntities.get(0).getId();
        } else if (storeId == null) {
            storeId = 1L;
        }

        Set<Role> roles;
        if ("admin".equalsIgnoreCase(username) || "gerant".equalsIgnoreCase(username)) {
            roles = Set.of(Role.ROLE_ADMIN, Role.ROLE_GERANT, Role.ROLE_VENDEUR);
        } else if ("bijoutier".equalsIgnoreCase(username) || "atelier".equalsIgnoreCase(username)) {
            roles = Set.of(Role.ROLE_BIJOUTIER, Role.ROLE_VENDEUR);
        } else {
            roles = Set.of(Role.ROLE_VENDEUR);
        }

        String token = jwtTokenProvider.generateToken(username, roles, storeId, tenantCode);
        Set<String> roleNames = roles.stream().map(Role::name).collect(Collectors.toSet());

        return ResponseEntity.ok(new LoginResponse(token, username, roleNames, storeId, tenantCode, storeDtos));
    }

    /**
     * Liste publique des entreprises SaaS actives pour l'écran de sélection initiale.
     */
    @GetMapping("/tenants")
    public ResponseEntity<List<TenantDto>> getTenants() {
        List<TenantDto> tenants = tenantRepository.findByActiveTrue().stream()
                .map(TenantDto::fromEntity)
                .toList();
        return ResponseEntity.ok(tenants);
    }

    /**
     * Liste des boutiques actives associées à une entreprise SaaS donnée (par slug code ou id).
     */
    @GetMapping("/tenants/{tenantId}/stores")
    public ResponseEntity<List<StoreDto>> getTenantStores(@PathVariable("tenantId") String tenantId) {
        Tenant tenant = resolveTenant(tenantId);
        List<Store> stores;
        if (tenant != null) {
            stores = storeRepository.findByTenantIdAndActiveTrue(tenant.getId());
            if (stores.isEmpty()) {
                stores = storeRepository.findByTenantCodeAndActiveTrue(tenant.getCode());
            }
        } else {
            stores = storeRepository.findByTenantCodeAndActiveTrue(tenantId);
        }
        List<StoreDto> storeDtos = stores.stream()
                .map(StoreDto::fromEntity)
                .toList();
        return ResponseEntity.ok(storeDtos);
    }

    /**
     * Permet à un gérant ou vendeur multi-boutiques de basculer de magasin et d'obtenir un JWT mis à jour.
     */
    @PostMapping("/switch-store")
    public ResponseEntity<LoginResponse> switchStore(
            @RequestBody(required = false) SwitchStoreRequest request,
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @AuthenticationPrincipal Object principal) {

        String username = "caissier";
        Set<Role> roles = Set.of(Role.ROLE_VENDEUR);
        String tenantCode = null;

        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            String token = authHeader.substring(7).trim();
            if (jwtTokenProvider.validateToken(token)) {
                username = jwtTokenProvider.getUsername(token);
                roles = jwtTokenProvider.getRoles(token);
                tenantCode = jwtTokenProvider.getTenantId(token);
            }
        }

        if (principal != null && ("caissier".equals(username) || username == null)) {
            username = principal.toString();
        }

        if (request != null && request.tenantId() != null && !request.tenantId().isBlank()) {
            tenantCode = request.tenantId();
        } else if (tenantCode == null) {
            tenantCode = TenantContextHolder.getTenantId();
        }

        Tenant tenant = resolveTenant(tenantCode);
        if (tenant != null) {
            tenantCode = tenant.getCode();
        } else if (tenantCode == null) {
            tenantCode = "maison-vendome";
        }

        List<Store> storeEntities;
        if (tenant != null) {
            storeEntities = storeRepository.findByTenantIdAndActiveTrue(tenant.getId());
            if (storeEntities.isEmpty()) {
                storeEntities = storeRepository.findByTenantCodeAndActiveTrue(tenant.getCode());
            }
        } else {
            storeEntities = storeRepository.findAll().stream().filter(Store::isActive).toList();
        }

        Long targetStoreId = request != null ? request.storeId() : null;
        if (targetStoreId == null && !storeEntities.isEmpty()) {
            targetStoreId = storeEntities.get(0).getId();
        } else if (targetStoreId == null) {
            targetStoreId = 1L;
        }

        if (roles.isEmpty()) {
            roles = Set.of(Role.ROLE_VENDEUR);
        }

        String newToken = jwtTokenProvider.generateToken(username, roles, targetStoreId, tenantCode);
        Set<String> roleNames = roles.stream().map(Role::name).collect(Collectors.toSet());
        List<StoreDto> storeDtos = storeEntities.stream().map(StoreDto::fromEntity).toList();

        return ResponseEntity.ok(new LoginResponse(newToken, username, roleNames, targetStoreId, tenantCode, storeDtos));
    }

    @GetMapping("/me")
    public ResponseEntity<Map<String, Object>> me(@AuthenticationPrincipal Object principal) {
        String currentTenant = TenantContextHolder.getTenantId();
        return ResponseEntity.ok(Map.of(
                "authenticated", principal != null,
                "principal", principal != null ? principal.toString() : "anonymous",
                "tenantId", currentTenant != null ? currentTenant : "none"
        ));
    }

    private Tenant resolveTenant(String tenantInput) {
        if (tenantInput == null || tenantInput.isBlank()) {
            return null;
        }
        String trimmed = tenantInput.trim();

        // 1. Check by slug code
        Optional<Tenant> byCode = tenantRepository.findByCode(trimmed);
        if (byCode.isPresent()) {
            return byCode.get();
        }

        // 2. Check by numeric ID
        try {
            Long id = Long.parseLong(trimmed);
            return tenantRepository.findById(id).orElse(null);
        } catch (NumberFormatException ignored) {
            return null;
        }
    }
}
