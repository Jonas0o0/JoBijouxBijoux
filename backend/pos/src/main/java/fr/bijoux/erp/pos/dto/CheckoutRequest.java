package fr.bijoux.erp.pos.dto;

import fr.bijoux.erp.catalog.domain.model.VatRegime;
import fr.bijoux.erp.pos.domain.model.PaymentMethod;
import fr.bijoux.erp.pos.domain.model.PosItemType;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

import java.util.List;

public record CheckoutRequest(
        @NotNull(message = "Le point de vente (storeId) est obligatoire")
        Long storeId,

        @NotNull(message = "L'opérateur caisse est obligatoire")
        String operatorUsername,

        Long customerId,

        @NotEmpty(message = "Le panier doit contenir au moins un article")
        @Valid
        List<CartLineDto> lines,

        @NotEmpty(message = "Au moins un règlement est obligatoire")
        @Valid
        List<PaymentDto> payments
) {
    public record CartLineDto(
            int lineNumber,
            PosItemType itemType,
            Long jewelryItemId,
            Long repairOrderId,
            @NotNull(message = "La désignation est obligatoire")
            String designation,
            @Positive(message = "La quantité doit être supérieure à zéro")
            int quantity,
            @Positive(message = "Le prix unitaire doit être positif")
            long unitPriceTtcCents,
            VatRegime vatRegime,
            Long purchasePriceHtCents,
            boolean isSecondHand,
            Long depositDeductedCents
    ) {
        public CartLineDto(int lineNumber,
                           PosItemType itemType,
                           Long jewelryItemId,
                           String designation,
                           int quantity,
                           long unitPriceTtcCents,
                           VatRegime vatRegime,
                           Long purchasePriceHtCents,
                           boolean isSecondHand) {
            this(lineNumber, itemType, jewelryItemId, null, designation, quantity, unitPriceTtcCents, vatRegime, purchasePriceHtCents, isSecondHand, 0L);
        }
    }

    public record PaymentDto(
            @NotNull(message = "Le mode de paiement est obligatoire")
            PaymentMethod paymentMethod,
            @Positive(message = "Le montant payé doit être strictement positif")
            long amountCents,
            Long cashReceivedCents,
            String tpeAuthToken,
            String voucherCode,
            Long scrapDossierId
    ) {}
}
