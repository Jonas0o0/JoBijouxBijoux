package fr.bijoux.erp.core.tenant.context;

/**
 * Record représentant le contexte d'un tenant.
 * Offre également les méthodes statiques utilitaires pour manipuler directement le contexte.
 */
public record TenantContext(String tenantId) {

    public static void setTenantId(String tenantId) {
        TenantContextHolder.setTenantId(tenantId);
    }

    public static String getTenantId() {
        return TenantContextHolder.getTenantId();
    }

    public static void clear() {
        TenantContextHolder.clear();
    }
}
