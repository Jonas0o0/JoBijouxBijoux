package fr.bijoux.erp.workshop.dto;

import fr.bijoux.erp.workshop.domain.model.WorkshopStatus;
import jakarta.validation.constraints.NotNull;

public record WorkshopStatusUpdateRequest(
        @NotNull(message = "Le nouveau statut est obligatoire")
        WorkshopStatus newStatus,

        String assignedArtisanUsername,
        Long finalPriceCents,
        String notes
) {}
