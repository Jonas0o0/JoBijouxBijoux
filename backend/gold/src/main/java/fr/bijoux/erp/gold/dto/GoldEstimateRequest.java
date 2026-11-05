package fr.bijoux.erp.gold.dto;

import fr.bijoux.erp.gold.domain.model.GoldTaxRegime;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;

import java.util.List;

public record GoldEstimateRequest(
        @NotNull(message = "Le régime fiscal est obligatoire")
        GoldTaxRegime taxStrategy,

        Long purchasePriceCents,
        Integer holdingYears,
        boolean proofOfAcquisitionAvailable,

        @NotEmpty(message = "Au moins un article à estimer est requis")
        @Valid
        List<CreateGoldDossierRequest.GoldScrapItemDto> items
) {}
