package fr.bijoux.erp.core.tenant.context;

/**
 * Gestionnaire du contexte multi-tenant pour la requête en cours.
 * Compatible avec les Virtual Threads de Java 21 (chaque requête / virtual thread dispose de son ThreadLocal).
 */
public final class TenantContextHolder {

    private static final ThreadLocal<String> CURRENT_TENANT = new ThreadLocal<>();

    private TenantContextHolder() {
    }

    public static void setTenantId(String tenantId) {
        CURRENT_TENANT.set(tenantId);
    }

    public static String getTenantId() {
        return CURRENT_TENANT.get();
    }

    public static void clear() {
        CURRENT_TENANT.remove();
    }

    public static TenantContext getContext() {
        return new TenantContext(getTenantId());
    }

    public static void setContext(TenantContext context) {
        if (context != null) {
            setTenantId(context.tenantId());
        } else {
            clear();
        }
    }
}
