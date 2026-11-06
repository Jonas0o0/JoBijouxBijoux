package fr.bijoux.erp.core.tenant;

import fr.bijoux.erp.core.tenant.context.TenantContextHolder;

/**
 * Façade de commodité pour le contexte tenant dans le package racine du module tenant.
 */
public final class TenantContext {

    private TenantContext() {
    }

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
