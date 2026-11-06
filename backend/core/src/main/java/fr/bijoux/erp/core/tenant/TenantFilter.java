package fr.bijoux.erp.core.tenant;

import fr.bijoux.erp.core.security.jwt.JwtTokenProvider;
import fr.bijoux.erp.core.tenant.context.TenantContextHolder;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

/**
 * Filtre de résolution et d'isolation multi-tenant pour les requêtes HTTP.
 * Lit l'en-tête HTTP 'X-Tenant-Id' ou extrait le claim JWT 'tenantId' si présent,
 * et renseigne le TenantContextHolder pour la durée de la requête.
 */
@Component
public class TenantFilter extends OncePerRequestFilter {

    public static final String TENANT_HEADER = "X-Tenant-Id";
    public static final String AUTHORIZATION_HEADER = "Authorization";
    public static final String BEARER_PREFIX = "Bearer ";

    private final JwtTokenProvider jwtTokenProvider;

    public TenantFilter(JwtTokenProvider jwtTokenProvider) {
        this.jwtTokenProvider = jwtTokenProvider;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {
        try {
            String tenantId = request.getHeader(TENANT_HEADER);

            if (!StringUtils.hasText(tenantId)) {
                String token = resolveBearerToken(request);
                if (StringUtils.hasText(token) && jwtTokenProvider.validateToken(token)) {
                    tenantId = jwtTokenProvider.getTenantId(token);
                }
            }

            if (StringUtils.hasText(tenantId)) {
                TenantContextHolder.setTenantId(tenantId.trim());
            }

            filterChain.doFilter(request, response);
        } finally {
            TenantContextHolder.clear();
        }
    }

    private String resolveBearerToken(HttpServletRequest request) {
        String bearerToken = request.getHeader(AUTHORIZATION_HEADER);
        if (StringUtils.hasText(bearerToken) && bearerToken.startsWith(BEARER_PREFIX)) {
            return bearerToken.substring(BEARER_PREFIX.length()).trim();
        }
        return null;
    }
}
