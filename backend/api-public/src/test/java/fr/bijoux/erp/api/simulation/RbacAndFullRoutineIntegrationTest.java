package fr.bijoux.erp.api.simulation;

import com.fasterxml.jackson.databind.ObjectMapper;
import fr.bijoux.erp.api.PosController;
import fr.bijoux.erp.core.security.dto.CreateUserRequest;
import fr.bijoux.erp.core.security.dto.UpdateRolesRequest;
import fr.bijoux.erp.core.security.jwt.JwtTokenProvider;
import fr.bijoux.erp.core.security.model.Role;
import fr.bijoux.erp.core.security.model.Store;
import fr.bijoux.erp.core.security.model.User;
import fr.bijoux.erp.core.security.repository.StoreRepository;
import fr.bijoux.erp.core.security.repository.UserRepository;
import fr.bijoux.erp.core.tenant.model.Tenant;
import fr.bijoux.erp.core.tenant.model.TenantPlan;
import fr.bijoux.erp.core.tenant.repository.TenantRepository;
import fr.bijoux.erp.pos.domain.service.FiscalClosureService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.MethodOrderer;
import org.junit.jupiter.api.Order;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.TestMethodOrder;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import java.util.Set;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Suite de tests d'intégration simulant les droits d'accès stricts (RBAC)
 * et les habilitations par profil :
 * - Patron / Administrateur (ROLE_ADMIN) : accès absolu à tout le réseau et à la comptabilité globale.
 * - Gérant de magasin (ROLE_GERANT) : gestion de son équipe magasin, clôtures mensuelles, mais restreint à son magasin.
 * - Vendeuse (ROLE_VENDEUR) : Caisse et vente opérationnelle autorisées, mais comptabilité et gestion d'utilisateurs INTERDITES (403 Forbidden).
 */
@SpringBootTest
@AutoConfigureMockMvc // FILTRES DE SÉCURITÉ ACTIFS
@ActiveProfiles("test")
@TestMethodOrder(MethodOrderer.OrderAnnotation.class)
@DisplayName("Simulation RBAC & Sécurité Métier : Initialisation, Droits Vendeuses, Gérants & Patron")
class RbacAndFullRoutineIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private JwtTokenProvider jwtTokenProvider;

    @Autowired
    private StoreRepository storeRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private TenantRepository tenantRepository;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @MockBean
    private FiscalClosureService fiscalClosureService;

    private String tokenVendeuse;
    private String tokenGerant;
    private String tokenAdmin;
    private Long storeId;
    private Long targetUserId;

    @BeforeEach
    void setUp() {
        try {
            jdbcTemplate.execute("ALTER TABLE event_publication ALTER COLUMN serialized_event SET DATA TYPE VARCHAR(10000)");
        } catch (Exception ignored) {}

        if (storeRepository.count() == 0) {
            Tenant tenant = tenantRepository.save(new Tenant("maison-vendome", "Maison Vendôme", "12345678900012", TenantPlan.PREMIUM_HAUTE_JOAILLERIE));
            Store store1 = new Store("STORE-PARIS-01", "Boutique Vendôme", tenant);
            storeRepository.save(store1);
        }

        Store store = storeRepository.findAll().get(0);
        this.storeId = store.getId();

        // Crée un utilisateur de test si aucun n'existe
        User user = userRepository.findByUsername("test_vendeuse_init").orElseGet(() -> {
            User u = new User("test_vendeuse_init", "hash1234", "Marie", "Curie", "marie@vendome.fr");
            u.setStore(store);
            u.setRoles(Set.of(Role.ROLE_VENDEUR));
            return userRepository.save(u);
        });
        this.targetUserId = user.getId();

        // Génération de vrais tokens JWT signés avec rôles distincts
        this.tokenVendeuse = jwtTokenProvider.generateToken("sophie_vendeuse", Set.of(Role.ROLE_VENDEUR), storeId, "1");
        this.tokenGerant = jwtTokenProvider.generateToken("alexandre_gerant", Set.of(Role.ROLE_GERANT), storeId, "1");
        this.tokenAdmin = jwtTokenProvider.generateToken("patron_admin", Set.of(Role.ROLE_ADMIN), storeId, "1");
    }

    @Test
    @Order(1)
    @DisplayName("1. Sécurité : Une vendeuse ne doit PAS pouvoir accéder à l'export comptable FEC (403 Forbidden)")
    void testVendeuseCannotAccessAccountingFec() throws Exception {
        mockMvc.perform(get("/api/v1/accounting/fec")
                        .param("storeId", String.valueOf(storeId))
                        .header("Authorization", "Bearer " + tokenVendeuse)
                        .header("X-Tenant-Id", "1"))
                .andExpect(status().isForbidden());
    }

    @Test
    @Order(2)
    @DisplayName("2. Sécurité : Une vendeuse ne doit PAS pouvoir exécuter la clôture mensuelle M (403 Forbidden)")
    void testVendeuseCannotExecuteMonthlyClosureM() throws Exception {
        mockMvc.perform(post("/api/v1/pos/closures/m")
                        .param("storeId", String.valueOf(storeId))
                        .param("operator", "sophie_vendeuse")
                        .header("Authorization", "Bearer " + tokenVendeuse)
                        .header("X-Tenant-Id", "1"))
                .andExpect(status().isForbidden());
    }

    @Test
    @Order(3)
    @DisplayName("3. Sécurité : Une vendeuse ne doit PAS pouvoir créer un autre compte utilisateur (403 Forbidden)")
    void testVendeuseCannotCreateUsers() throws Exception {
        CreateUserRequest request = new CreateUserRequest(
                "pirate_user",
                "hacker",
                "Jean",
                "Dupont",
                "hacker@vendome.fr",
                storeId,
                Set.of(Role.ROLE_GERANT)
        );

        mockMvc.perform(post("/api/v1/users")
                        .header("Authorization", "Bearer " + tokenVendeuse)
                        .header("X-Tenant-Id", "1")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isForbidden());
    }

    @Test
    @Order(4)
    @DisplayName("4. Sécurité : Une vendeuse ne doit PAS pouvoir modifier les rôles d'un utilisateur (403 Forbidden)")
    void testVendeuseCannotUpdateRoles() throws Exception {
        UpdateRolesRequest request = new UpdateRolesRequest(Set.of(Role.ROLE_ADMIN));

        mockMvc.perform(patch("/api/v1/users/" + targetUserId + "/roles")
                        .header("Authorization", "Bearer " + tokenVendeuse)
                        .header("X-Tenant-Id", "1")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isForbidden());
    }

    @Test
    @Order(5)
    @DisplayName("5. Droits Vendeuse : La vendeuse a bien le droit d'ouvrir le fond de caisse (200 OK)")
    void testVendeuseCanRecordCashFloat() throws Exception {
        PosController.CashFloatRequest cashFloat = new PosController.CashFloatRequest(
                storeId,
                "CAISSE-01",
                30_000L,
                "sophie_vendeuse",
                "Fond de caisse 300 EUR"
        );

        mockMvc.perform(post("/api/v1/pos/cash-float")
                        .header("Authorization", "Bearer " + tokenVendeuse)
                        .header("X-Tenant-Id", "1")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(cashFloat)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("RECORDED"))
                .andExpect(jsonPath("$.amountCents").value(30000));
    }

    @Test
    @Order(6)
    @DisplayName("6. Droits Gérant : Le gérant de magasin PEUT créer une nouvelle vendeuse pour sa boutique (201 Created)")
    void testGerantCanCreateSellerAccount() throws Exception {
        CreateUserRequest request = new CreateUserRequest(
                "claire_vendeuse",
                "9876",
                "Claire",
                "Lemoine",
                "claire.lemoine@vendome.fr",
                storeId,
                Set.of(Role.ROLE_VENDEUR)
        );

        mockMvc.perform(post("/api/v1/users")
                        .header("Authorization", "Bearer " + tokenGerant)
                        .header("X-Tenant-Id", "1")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.username").value("claire_vendeuse"))
                .andExpect(jsonPath("$.roles[0]").value("ROLE_VENDEUR"));
    }

    @Test
    @Order(7)
    @DisplayName("7. Droits Gérant : Le gérant peut modifier les rôles d'une collaboratrice de son équipe (200 OK)")
    void testGerantCanUpdateCollaboratorRole() throws Exception {
        // Claire est promue responsable adjointe (ROLE_GERANT)
        UpdateRolesRequest request = new UpdateRolesRequest(Set.of(Role.ROLE_GERANT, Role.ROLE_VENDEUR));

        mockMvc.perform(patch("/api/v1/users/" + targetUserId + "/roles")
                        .header("Authorization", "Bearer " + tokenGerant)
                        .header("X-Tenant-Id", "1")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.roles").isArray());
    }

    @Test
    @Order(8)
    @DisplayName("8. Droits Patron : Le Patron (ROLE_ADMIN) a un accès absolu à la clôture annuelle A (200 OK)")
    void testAdminCanExecuteAnnualClosure() throws Exception {
        fr.bijoux.erp.pos.domain.model.FiscalClosure mockClosure = new fr.bijoux.erp.pos.domain.model.FiscalClosure(
                fr.bijoux.erp.pos.domain.model.FiscalClosureType.ANNUEL_A,
                1L,
                storeId,
                "patron_admin",
                java.time.Instant.now(),
                java.time.Instant.now(),
                15_000_000L,
                12_500_000L,
                2_500_000L,
                "{}",
                "{}",
                15_000_000L,
                "0000000000000000",
                "current-hash-123",
                "sig-nf525"
        );
        when(fiscalClosureService.executeAnnualA(eq(storeId), any())).thenReturn(mockClosure);

        mockMvc.perform(post("/api/v1/pos/closures/a")
                        .param("storeId", String.valueOf(storeId))
                        .param("operator", "patron_admin")
                        .header("Authorization", "Bearer " + tokenAdmin)
                        .header("X-Tenant-Id", "1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.closureType").value("ANNUEL_A"))
                .andExpect(jsonPath("$.sequenceNumber").value(1));
    }
}
