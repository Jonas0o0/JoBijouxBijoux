package fr.bijoux.erp.core.security.jwt;

import fr.bijoux.erp.core.security.model.Role;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Fournisseur de jetons JWT sécurisés pour l'authentification et l'autorisation HBJO.
 */
@Component
public class JwtTokenProvider {

    private final SecretKey key;
    private final long validityInMilliseconds;

    public JwtTokenProvider(
            @Value("${erp.security.jwt.secret:ERP_BIJOUX_SUPER_SECRET_KEY_FOR_JWT_SIGNING_PHASE1_HBJO_2026_VERY_SECURE}") String secret,
            @Value("${erp.security.jwt.expiration-ms:86400000}") long validityInMilliseconds) { // 24h par défaut
        byte[] keyBytes = secret.getBytes(StandardCharsets.UTF_8);
        if (keyBytes.length < 32) {
            // Assure au moins 256 bits pour HMAC-SHA256
            keyBytes = Arrays.copyOf(keyBytes, 32);
        }
        this.key = Keys.hmacShaKeyFor(keyBytes);
        this.validityInMilliseconds = validityInMilliseconds;
    }

    /**
     * Génère un token JWT signé avec les rôles et le magasin rattaché.
     */
    public String generateToken(String username, Set<Role> roles, Long storeId) {
        return generateToken(username, roles, storeId, null);
    }

    /**
     * Génère un token JWT signé avec les rôles, le magasin et le tenant rattachés.
     */
    public String generateToken(String username, Set<Role> roles, Long storeId, String tenantId) {
        Date now = new Date();
        Date validity = new Date(now.getTime() + validityInMilliseconds);

        List<String> roleNames = roles.stream()
                .map(Role::name)
                .collect(Collectors.toList());

        var builder = Jwts.builder()
                .subject(username)
                .claim("roles", roleNames)
                .issuedAt(now)
                .expiration(validity)
                .signWith(key);

        if (storeId != null) {
            builder.claim("storeId", storeId);
        }

        if (tenantId != null && !tenantId.isBlank()) {
            builder.claim("tenantId", tenantId);
        }

        return builder.compact();
    }

    public boolean validateToken(String token) {
        try {
            Jwts.parser().verifyWith(key).build().parseSignedClaims(token);
            return true;
        } catch (JwtException | IllegalArgumentException e) {
            return false;
        }
    }

    public String getUsername(String token) {
        return getClaims(token).getSubject();
    }

    @SuppressWarnings("unchecked")
    public Set<Role> getRoles(String token) {
        List<String> roles = (List<String>) getClaims(token).get("roles");
        if (roles == null) {
            return Collections.emptySet();
        }
        return roles.stream()
                .map(Role::valueOf)
                .collect(Collectors.toSet());
    }

    public Long getStoreId(String token) {
        Object storeIdObj = getClaims(token).get("storeId");
        if (storeIdObj instanceof Number number) {
            return number.longValue();
        }
        return null;
    }

    public String getTenantId(String token) {
        Object tenantIdObj = getClaims(token).get("tenantId");
        if (tenantIdObj != null) {
            return tenantIdObj.toString();
        }
        return null;
    }

    private Claims getClaims(String token) {
        return Jwts.parser().verifyWith(key).build().parseSignedClaims(token).getPayload();
    }
}
