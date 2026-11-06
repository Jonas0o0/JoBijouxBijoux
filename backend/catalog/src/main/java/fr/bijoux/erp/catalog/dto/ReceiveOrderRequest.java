package fr.bijoux.erp.catalog.dto;

import jakarta.validation.constraints.NotBlank;

public record ReceiveOrderRequest(
        @NotBlank(message = "L'emplacement de destination (VITRINE ou COFFRE) est obligatoire")
        String destinationStock
) {}
