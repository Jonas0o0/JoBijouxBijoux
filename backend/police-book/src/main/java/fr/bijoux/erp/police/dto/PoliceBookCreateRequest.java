package fr.bijoux.erp.police.dto;

import fr.bijoux.erp.police.domain.model.PoliceEntryType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

import java.math.BigDecimal;
import java.time.Instant;

public record PoliceBookCreateRequest(
        @NotNull(message = "Le point de vente est obligatoire")
        Long storeId,

        @NotNull(message = "Le type d'entrée est obligatoire")
        PoliceEntryType entryType,

        @NotBlank(message = "La description de l'objet est obligatoire")
        String itemDescription,

        @NotBlank(message = "Le type de métal est obligatoire")
        String metalType,

        @NotBlank(message = "Le titre du métal est obligatoire (ex: 750‰)")
        String fineness,

        @NotNull(message = "Le poids brut est obligatoire")
        @Positive(message = "Le poids brut doit être positif")
        BigDecimal grossWeightGrams,

        BigDecimal estimatedNetWeightGrams,

        String hallmarks,

        @NotBlank(message = "L'identité du vendeur est obligatoire")
        String sellerFullName,

        @NotBlank(message = "Le numéro de CNI ou passeport est obligatoire (CGI art. 537/538)")
        String sellerCniPassport,

        String sellerAddress,

        @Positive(message = "Le prix d'achat doit être positif ou nul")
        long purchasePriceCents,

        Instant entryDate
) {}
