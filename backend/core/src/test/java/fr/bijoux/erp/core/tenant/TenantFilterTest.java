package fr.bijoux.erp.core.tenant;

import fr.bijoux.erp.core.security.jwt.JwtTokenProvider;
import fr.bijoux.erp.core.security.model.Role;
import fr.bijoux.erp.core.tenant.context.TenantContextHolder;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;

import java.io.IOException;
import java.util.Set;
import java.util.concurrent.atomic.AtomicReference;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

@DisplayName("Tests unitaires du filtre TenantFilter")
class TenantFilterTest {

    private JwtTokenProvider jwtTokenProvider;
    private TenantFilter tenantFilter;

    @BeforeEach
    void setUp() {
        jwtTokenProvider = new JwtTokenProvider(
                "TESTING_SECRET_KEY_FOR_TENANT_FILTER_256_BITS_MINIMUM",
                3600000L
        );
        tenantFilter = new TenantFilter(jwtTokenProvider);
        TenantContextHolder.clear();
    }

    @AfterEach
    void tearDown() {
        TenantContextHolder.clear();
    }

    @Test
    @DisplayName("Doit extraire le tenantId depuis l'en-tête X-Tenant-Id")
    void shouldExtractTenantFromHeader() throws ServletException, IOException {
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.addHeader(TenantFilter.TENANT_HEADER, "maison-vendome");
        MockHttpServletResponse response = new MockHttpServletResponse();

        AtomicReference<String> capturedTenant = new AtomicReference<>();
        FilterChain filterChain = (req, res) -> capturedTenant.set(TenantContextHolder.getTenantId());

        tenantFilter.doFilter(request, response, filterChain);

        assertThat(capturedTenant.get()).isEqualTo("maison-vendome");
        // Vérifie le nettoyage après exécution
        assertThat(TenantContextHolder.getTenantId()).isNull();
    }

    @Test
    @DisplayName("Doit extraire le tenantId depuis le claim JWT si l'en-tête est absent")
    void shouldExtractTenantFromJwtClaim() throws ServletException, IOException {
        String token = jwtTokenProvider.generateToken("gerant", Set.of(Role.ROLE_GERANT), 2L, "joaillerie-dubois");

        MockHttpServletRequest request = new MockHttpServletRequest();
        request.addHeader("Authorization", "Bearer " + token);
        MockHttpServletResponse response = new MockHttpServletResponse();

        AtomicReference<String> capturedTenant = new AtomicReference<>();
        FilterChain filterChain = (req, res) -> capturedTenant.set(TenantContextHolder.getTenantId());

        tenantFilter.doFilter(request, response, filterChain);

        assertThat(capturedTenant.get()).isEqualTo("joaillerie-dubois");
        assertThat(TenantContextHolder.getTenantId()).isNull();
    }

    @Test
    @DisplayName("L'en-tête X-Tenant-Id doit avoir la priorité sur le JWT")
    void shouldPrioritizeHeaderOverJwtClaim() throws ServletException, IOException {
        String token = jwtTokenProvider.generateToken("gerant", Set.of(Role.ROLE_GERANT), 2L, "joaillerie-dubois");

        MockHttpServletRequest request = new MockHttpServletRequest();
        request.addHeader("Authorization", "Bearer " + token);
        request.addHeader(TenantFilter.TENANT_HEADER, "maison-vendome");
        MockHttpServletResponse response = new MockHttpServletResponse();

        AtomicReference<String> capturedTenant = new AtomicReference<>();
        FilterChain filterChain = (req, res) -> capturedTenant.set(TenantContextHolder.getTenantId());

        tenantFilter.doFilter(request, response, filterChain);

        assertThat(capturedTenant.get()).isEqualTo("maison-vendome");
        assertThat(TenantContextHolder.getTenantId()).isNull();
    }

    @Test
    @DisplayName("Doit nettoyer le contexte même en cas d'exception dans la chaîne de filtres")
    void shouldCleanContextEvenOnException() {
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.addHeader(TenantFilter.TENANT_HEADER, "maison-vendome");
        MockHttpServletResponse response = new MockHttpServletResponse();

        FilterChain filterChain = (req, res) -> {
            assertThat(TenantContextHolder.getTenantId()).isEqualTo("maison-vendome");
            throw new RuntimeException("Erreur simulée dans la chaîne");
        };

        assertThatThrownBy(() -> tenantFilter.doFilter(request, response, filterChain))
                .isInstanceOf(RuntimeException.class)
                .hasMessage("Erreur simulée dans la chaîne");

        assertThat(TenantContextHolder.getTenantId()).isNull();
    }
}
