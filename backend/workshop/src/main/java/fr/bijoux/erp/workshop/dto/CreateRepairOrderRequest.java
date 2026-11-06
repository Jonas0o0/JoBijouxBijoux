package fr.bijoux.erp.workshop.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

import java.math.BigDecimal;

public record CreateRepairOrderRequest(
        @NotNull(message = "Le point de vente est obligatoire")
        Long storeId,

        Long customerId,

        @NotBlank(message = "L'opérateur caisse/atelier est obligatoire")
        String operatorUsername,

        @NotBlank(message = "La description de l'objet confié est obligatoire")
        String itemDescription,

        @NotBlank(message = "Le métal est obligatoire")
        String metalType,

        @NotBlank(message = "Le titre est obligatoire (ex: 750‰)")
        String fineness,

        @NotNull(message = "Le poids brut au dépôt est obligatoire")
        @Positive(message = "Le poids brut doit être positif")
        BigDecimal grossWeightGrams,

        String svgDefectDiagram,
        Long estimatedQuoteCents,
        String customerNotes,
        Long depositPaidCents,
        Long laborCostCents
) {
    public CreateRepairOrderRequest(Long storeId, Long customerId, String operatorUsername,
                                    String itemDescription, String metalType, String fineness,
                                    BigDecimal grossWeightGrams, String svgDefectDiagram,
                                    Long estimatedQuoteCents, String customerNotes) {
        this(storeId, customerId, operatorUsername, itemDescription, metalType, fineness,
                grossWeightGrams, svgDefectDiagram, estimatedQuoteCents, customerNotes, 0L, 0L);
    }
}
