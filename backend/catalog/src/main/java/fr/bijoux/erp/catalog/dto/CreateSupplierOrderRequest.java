package fr.bijoux.erp.catalog.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;

import java.util.List;

public record CreateSupplierOrderRequest(
        @NotNull(message = "Le point de vente (storeId) est obligatoire")
        Long storeId,

        @NotBlank(message = "Le nom du fournisseur est obligatoire")
        String supplierName,

        @NotEmpty(message = "La commande doit comporter au moins un article")
        @Valid
        List<OrderItemDto> items,

        String notes
) {
    public CreateSupplierOrderRequest(Long storeId, String supplierName, List<OrderItemDto> items) {
        this(storeId, supplierName, items, null);
    }
}
