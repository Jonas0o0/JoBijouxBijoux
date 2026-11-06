package fr.bijoux.erp.catalog.dto;

import fr.bijoux.erp.catalog.domain.model.VatRegime;
import fr.bijoux.erp.core.domain.valueobject.GoldFineness;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

import java.math.BigDecimal;

/**
 * DTO représentant une ligne d'article dans une commande d'achat fournisseur.
 */
public record OrderItemDto(
        String referenceNumber,

        @NotBlank(message = "La désignation de l'article est obligatoire")
        String designation,

        @Positive(message = "La quantité doit être strictement positive")
        int quantity,

        @NotNull(message = "Le prix d'achat unitaire HT est obligatoire")
        @Positive(message = "Le prix d'achat unitaire HT doit être positif")
        Long unitPurchasePriceHtCents,

        GoldFineness fineness,
        BigDecimal grossWeightGrams,
        Long sellingPriceTtcCents,
        VatRegime vatRegime
) {
    public OrderItemDto(String referenceNumber, String designation, int quantity, Long unitPurchasePriceHtCents) {
        this(referenceNumber, designation, quantity, unitPurchasePriceHtCents, GoldFineness.OR_750, new BigDecimal("3.500"), unitPurchasePriceHtCents * 2L, VatRegime.STANDARD_20);
    }
}
