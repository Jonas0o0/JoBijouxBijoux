package fr.bijoux.erp.gold.dto;

import fr.bijoux.erp.gold.domain.model.GoldPaymentMethod;
import fr.bijoux.erp.gold.domain.model.GoldTaxRegime;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

import java.math.BigDecimal;
import java.util.List;

public record CreateGoldDossierRequest(
        @NotNull(message = "Le point de vente est obligatoire")
        Long storeId,

        @NotBlank(message = "L'opérateur est obligatoire")
        String operatorUsername,

        Long customerId,

        @NotBlank(message = "Le nom complet du vendeur est obligatoire")
        String sellerFullName,

        @NotBlank(message = "La pièce d'identité (CNI ou passeport) est obligatoire")
        String sellerCniPassport,

        String sellerAddress,

        @NotNull(message = "Le régime fiscal est obligatoire")
        GoldTaxRegime taxStrategy,

        @NotNull(message = "Le mode de règlement est obligatoire (virement ou chèque)")
        GoldPaymentMethod paymentMethod,

        Long initialPurchasePriceCents,
        Integer holdingYears,

        @NotEmpty(message = "Le dossier doit contenir au moins un lot de métal précieux")
        @Valid
        List<GoldScrapItemDto> items
) {
    public record GoldScrapItemDto(
            @NotBlank(message = "La description est obligatoire")
            String description,
            String metalType,
            String fineness,
            @NotNull @Positive(message = "Le poids brut doit être positif")
            BigDecimal grossWeightGrams,
            @NotNull @Positive(message = "Le poids net estimé doit être positif")
            BigDecimal estimatedNetWeightGrams,
            @NotNull @Positive(message = "Le taux de pureté doit être positif")
            BigDecimal purityRate,
            @NotNull @Positive(message = "Le cours au gramme doit être positif")
            long unitPricePerGramCents
    ) {}
}
