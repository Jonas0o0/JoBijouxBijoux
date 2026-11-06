package fr.bijoux.erp.core.security.jwt;

import fr.bijoux.erp.core.security.model.Role;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;

@DisplayName("Tests unitaires du JwtTokenProvider")
class JwtTokenProviderTest {

    private JwtTokenProvider jwtTokenProvider;

    @BeforeEach
    void setUp() {
        jwtTokenProvider = new JwtTokenProvider(
                "TESTING_VERY_STRONG_SECRET_KEY_FOR_PHASE_1_256_BITS_MINIMUM_LENGTH",
                3600000L // 1 heure
        );
    }

    @Test
    @DisplayName("Doit générer un JWT valide avec rôles et storeId et l'extraire avec succès")
    void shouldGenerateAndValidateJwtToken() {
        String username = "jean.dupont";
        Set<Role> roles = Set.of(Role.ROLE_VENDEUR, Role.ROLE_GERANT);
        Long storeId = 42L;

        String token = jwtTokenProvider.generateToken(username, roles, storeId);

        assertThat(token).isNotBlank();
        assertThat(jwtTokenProvider.validateToken(token)).isTrue();
        assertThat(jwtTokenProvider.getUsername(token)).isEqualTo(username);
        assertThat(jwtTokenProvider.getRoles(token)).containsExactlyInAnyOrder(Role.ROLE_VENDEUR, Role.ROLE_GERANT);
        assertThat(jwtTokenProvider.getStoreId(token)).isEqualTo(storeId);
    }

    @Test
    @DisplayName("Doit générer un JWT valide avec rôles, storeId et tenantId et les extraire avec succès")
    void shouldGenerateAndValidateJwtTokenWithTenant() {
        String username = "marie.curie";
        Set<Role> roles = Set.of(Role.ROLE_ADMIN);
        Long storeId = 1L;
        String tenantId = "maison-vendome";

        String token = jwtTokenProvider.generateToken(username, roles, storeId, tenantId);

        assertThat(token).isNotBlank();
        assertThat(jwtTokenProvider.validateToken(token)).isTrue();
        assertThat(jwtTokenProvider.getUsername(token)).isEqualTo(username);
        assertThat(jwtTokenProvider.getRoles(token)).containsExactly(Role.ROLE_ADMIN);
        assertThat(jwtTokenProvider.getStoreId(token)).isEqualTo(storeId);
        assertThat(jwtTokenProvider.getTenantId(token)).isEqualTo(tenantId);
    }

    @Test
    @DisplayName("Doit rejeter un token invalide ou altéré")
    void shouldRejectInvalidToken() {
        assertThat(jwtTokenProvider.validateToken("invalide.token.string")).isFalse();
    }
}
