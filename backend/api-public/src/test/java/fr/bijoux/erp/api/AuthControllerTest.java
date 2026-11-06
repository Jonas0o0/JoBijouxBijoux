package fr.bijoux.erp.api;

import com.fasterxml.jackson.databind.ObjectMapper;
import fr.bijoux.erp.core.security.jwt.JwtTokenProvider;
import fr.bijoux.erp.core.security.model.Role;
import fr.bijoux.erp.core.security.model.Store;
import fr.bijoux.erp.core.security.repository.StoreRepository;
import fr.bijoux.erp.core.tenant.model.Tenant;
import fr.bijoux.erp.core.tenant.model.TenantPlan;
import fr.bijoux.erp.core.tenant.repository.TenantRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;
import java.util.Optional;
import java.util.Set;

import static org.hamcrest.Matchers.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(AuthController.class)
@AutoConfigureMockMvc(addFilters = false)
@DisplayName("Tests du contrôleur d'authentification SaaS multi-tenant & multi-boutiques (AuthController)")
class AuthControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private JwtTokenProvider jwtTokenProvider;

    @MockBean
    private TenantRepository tenantRepository;

    @MockBean
    private StoreRepository storeRepository;

    private Tenant tenantVendome;
    private Tenant tenantDubois;
    private Store storeVendome1;
    private Store storeVendome2;
    private Store storeDubois1;

    @BeforeEach
    void setUp() {
        tenantVendome = new Tenant("maison-vendome", "Maison Vendôme - Haute Joaillerie", "12345678900012", TenantPlan.PREMIUM_HAUTE_JOAILLERIE);
        tenantVendome.setId(1L);

        tenantDubois = new Tenant("joaillerie-dubois", "Atelier Joaillerie Dubois & Fils", "98765432100019", TenantPlan.STANDARD);
        tenantDubois.setId(2L);

        storeVendome1 = new Store("STORE-PARIS-01", "Boutique Flagship Place Vendôme - Paris 1er", tenantVendome);
        storeVendome1.setId(1L);
        storeVendome1.setCity("Paris");

        storeVendome2 = new Store("STORE-PARIS-02", "Boutique Printemps Haussmann - Paris 9e", tenantVendome);
        storeVendome2.setId(2L);
        storeVendome2.setCity("Paris");

        storeDubois1 = new Store("STORE-LYON-01", "Boutique & Atelier Lyon Presqu'île", tenantDubois);
        storeDubois1.setId(4L);
        storeDubois1.setCity("Lyon");
    }

    @Test
    @DisplayName("GET /api/auth/tenants - Doit lister les entreprises SaaS actives")
    void shouldListActiveTenants() throws Exception {
        when(tenantRepository.findByActiveTrue()).thenReturn(List.of(tenantVendome, tenantDubois));

        mockMvc.perform(get("/api/auth/tenants"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(2)))
                .andExpect(jsonPath("$[0].code", is("maison-vendome")))
                .andExpect(jsonPath("$[0].name", is("Maison Vendôme - Haute Joaillerie")))
                .andExpect(jsonPath("$[0].plan", is("PREMIUM_HAUTE_JOAILLERIE")))
                .andExpect(jsonPath("$[1].code", is("joaillerie-dubois")))
                .andExpect(jsonPath("$[1].plan", is("STANDARD")));
    }

    @Test
    @DisplayName("GET /api/auth/tenants/{tenantId}/stores - Doit lister les boutiques du tenant sélectionné")
    void shouldListStoresForTenant() throws Exception {
        when(tenantRepository.findByCode("maison-vendome")).thenReturn(Optional.of(tenantVendome));
        when(storeRepository.findByTenantIdAndActiveTrue(1L)).thenReturn(List.of(storeVendome1, storeVendome2));

        mockMvc.perform(get("/api/auth/tenants/maison-vendome/stores"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(2)))
                .andExpect(jsonPath("$[0].id", is(1)))
                .andExpect(jsonPath("$[0].name", containsString("Vendôme")))
                .andExpect(jsonPath("$[1].id", is(2)))
                .andExpect(jsonPath("$[1].name", containsString("Printemps Haussmann")));
    }

    @Test
    @DisplayName("POST /api/auth/login - Connexion SaaS avec tenantId et storeId")
    void shouldLoginWithTenantAndStore() throws Exception {
        when(tenantRepository.findByCode("maison-vendome")).thenReturn(Optional.of(tenantVendome));
        when(storeRepository.findByTenantIdAndActiveTrue(1L)).thenReturn(List.of(storeVendome1, storeVendome2));
        when(jwtTokenProvider.generateToken(eq("admin"), any(), eq(1L), eq("maison-vendome")))
                .thenReturn("mocked.jwt.token.vendome");

        AuthController.LoginRequest request = new AuthController.LoginRequest("admin", "secret", "maison-vendome", 1L);

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token", is("mocked.jwt.token.vendome")))
                .andExpect(jsonPath("$.username", is("admin")))
                .andExpect(jsonPath("$.tenantId", is("maison-vendome")))
                .andExpect(jsonPath("$.storeId", is(1)))
                .andExpect(jsonPath("$.roles", hasItem("ROLE_ADMIN")))
                .andExpect(jsonPath("$.stores", hasSize(2)))
                .andExpect(jsonPath("$.stores[0].code", is("STORE-PARIS-01")));
    }

    @Test
    @DisplayName("POST /api/auth/switch-store - Bascule de magasin et émission d'un JWT mis à jour")
    void shouldSwitchStoreAndReturnUpdatedToken() throws Exception {
        when(jwtTokenProvider.validateToken("existing.valid.token")).thenReturn(true);
        when(jwtTokenProvider.getUsername("existing.valid.token")).thenReturn("gerant");
        when(jwtTokenProvider.getRoles("existing.valid.token")).thenReturn(Set.of(Role.ROLE_GERANT, Role.ROLE_VENDEUR));
        when(jwtTokenProvider.getTenantId("existing.valid.token")).thenReturn("maison-vendome");

        when(tenantRepository.findByCode("maison-vendome")).thenReturn(Optional.of(tenantVendome));
        when(storeRepository.findByTenantIdAndActiveTrue(1L)).thenReturn(List.of(storeVendome1, storeVendome2));

        when(jwtTokenProvider.generateToken(eq("gerant"), any(), eq(2L), eq("maison-vendome")))
                .thenReturn("new.updated.jwt.token.store2");

        AuthController.SwitchStoreRequest switchRequest = new AuthController.SwitchStoreRequest(2L, "maison-vendome");

        mockMvc.perform(post("/api/auth/switch-store")
                        .header("Authorization", "Bearer existing.valid.token")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(switchRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token", is("new.updated.jwt.token.store2")))
                .andExpect(jsonPath("$.storeId", is(2)))
                .andExpect(jsonPath("$.tenantId", is("maison-vendome")))
                .andExpect(jsonPath("$.username", is("gerant")))
                .andExpect(jsonPath("$.roles", hasItem("ROLE_GERANT")));
    }
}
