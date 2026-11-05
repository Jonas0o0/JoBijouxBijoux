package fr.bijoux.erp.crm.dto;

import fr.bijoux.erp.crm.domain.model.MeasurementType;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

import java.math.BigDecimal;

public record AddMeasurementRequest(
        @NotNull(message = "Le type de mensuration est obligatoire")
        MeasurementType measurementType,

        @NotNull(message = "La valeur de la mensuration est obligatoire")
        @Positive(message = "La valeur doit être strictement positive")
        BigDecimal value,

        String fingerName
) {}
