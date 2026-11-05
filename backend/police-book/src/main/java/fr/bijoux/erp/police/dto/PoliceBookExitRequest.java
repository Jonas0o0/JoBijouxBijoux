package fr.bijoux.erp.police.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

import java.time.Instant;

public record PoliceBookExitRequest(
        @NotNull(message = "L'identifiant de l'enregistrement est obligatoire")
        Long entryId,

        Instant exitDate,

        @NotBlank(message = "Le numéro de ticket ou facture est obligatoire")
        String ticketNumber,

        String exitReason,

        @Positive(message = "Le prix de sortie doit être positif")
        Long exitPriceCents
) {}
