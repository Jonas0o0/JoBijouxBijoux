package fr.bijoux.erp.workshop.dto;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

import java.math.BigDecimal;
import java.util.List;

public record CreateCustomOrderRequest(
        @NotNull(message = "Le point de vente est obligatoire")
        Long storeId,

        Long customerId,

        @NotBlank(message = "L'opérateur est obligatoire")
        String operatorUsername,

        @NotBlank(message = "Le titre du projet est obligatoire")
        String title,

        String description,

        @NotNull(message = "Le poids d'or fin estimé est obligatoire")
        @Positive(message = "Le poids d'or doit être positif")
        BigDecimal estimatedGoldWeightGrams,

        @DecimalMin(value = "3.00", message = "La perte au feu (freinte) minimale est de 3.00%")
        @DecimalMax(value = "8.00", message = "La perte au feu (freinte) maximale est de 8.00%")
        BigDecimal fireLossPercentage,

        @Positive(message = "Le devis doit être positif")
        long quotePriceCents,

        List<ComponentDto> components
) {
    public record ComponentDto(
            String componentName,
            int quantity,
            long unitCostCents
    ) {}
}
