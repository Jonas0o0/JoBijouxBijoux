package fr.bijoux.erp.weightaccount.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Positive;

public record RecordFixingRequest(
        String metalType,
        String currency,
        @Positive(message = "Le cours spot au gramme doit être positif")
        long spotPricePerGramCents,
        @NotBlank(message = "La source du fixing est obligatoire (ex: LBMA, Euronext)")
        String source
) {}
