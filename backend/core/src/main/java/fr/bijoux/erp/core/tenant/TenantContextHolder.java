package fr.bijoux.erp.core.tenant;

/**
 * Façade de commodité pour TenantContextHolder.
 */
public final class TenantContextHolder {

    private TenantContextHolder() {
    }

    public static void setTenantId(String tenantId) {
        fr.bijoux.erp.core.tenant.context.TenantContextHolder.setTenantId(tenantId);
    }

    public static String getTenantId() {
        return fr.bijoux.erp.core.tenant.context.TenantContextHolder.getTenantId();
    }

    public static void clear() {
        fr.bijoux.erp.core.tenant.context.TenantContextHolder.clear();
    }
}
