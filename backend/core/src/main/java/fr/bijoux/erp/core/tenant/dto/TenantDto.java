package fr.bijoux.erp.core.tenant.dto;

import fr.bijoux.erp.core.tenant.model.Tenant;
import fr.bijoux.erp.core.tenant.model.TenantPlan;

import java.time.Instant;

public record TenantDto(
        Long id,
        String code,
        String name,
        String siret,
        TenantPlan plan,
        boolean active,
        Instant createdAt
) {
    public static TenantDto fromEntity(Tenant tenant) {
        if (tenant == null) {
            return null;
        }
        return new TenantDto(
                tenant.getId(),
                tenant.getCode(),
                tenant.getName(),
                tenant.getSiret(),
                tenant.getPlan(),
                tenant.isActive(),
                tenant.getCreatedAt()
        );
    }
}
