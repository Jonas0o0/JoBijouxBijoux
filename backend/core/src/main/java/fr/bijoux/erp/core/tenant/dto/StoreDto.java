package fr.bijoux.erp.core.tenant.dto;

import fr.bijoux.erp.core.security.model.Store;

public record StoreDto(
        Long id,
        String code,
        String name,
        String siret,
        String address,
        String postalCode,
        String city,
        String phone,
        String email,
        String vatNumber,
        boolean active,
        Long tenantId,
        String tenantCode
) {
    public static StoreDto fromEntity(Store store) {
        if (store == null) {
            return null;
        }
        return new StoreDto(
                store.getId(),
                store.getCode(),
                store.getName(),
                store.getSiret(),
                store.getAddress(),
                store.getPostalCode(),
                store.getCity(),
                store.getPhone(),
                store.getEmail(),
                store.getVatNumber(),
                store.isActive(),
                store.getTenantId(),
                store.getTenantCode()
        );
    }
}
