package fr.bijoux.erp.weightaccount.dto;

import fr.bijoux.erp.weightaccount.domain.model.WeightMovementType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

import java.math.BigDecimal;

public record WeightMovementRequest(
        @NotNull(message = "Le point de vente est obligatoire")
        Long storeId,

        @NotBlank(message = "Le nom du tiers (affineur, façonnier) est obligatoire")
        String partnerName,

        @NotBlank(message = "Le type de tiers est obligatoire")
        String partnerType,

        String metalType,

        @NotNull(message = "Le type de mouvement est obligatoire")
        WeightMovementType movementType,

        @NotNull(message = "Le poids d'or fin est obligatoire")
        @Positive(message = "Le poids d'or fin doit être strictement positif")
        BigDecimal weightFineGoldGrams,

        String referenceDocument,
        String notes
) {}
