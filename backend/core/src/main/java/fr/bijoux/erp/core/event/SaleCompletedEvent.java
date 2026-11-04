package fr.bijoux.erp.core.event;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

/**
 * Événement métier déclenché lors de la finalisation d'une vente en caisse (POS).
 * Écouté par les modules Catalog (décrément / statut VENDU) et PoliceBook (sortie d'occasion).
 */
public record SaleCompletedEvent(
        Long ticketId,
        String ticketNumber,
        Long storeId,
        String operatorUsername,
        Long customerId,
        Long totalTtcCents,
        Long totalVatCents,
        List<SaleLineItem> lines,
        Instant occurredAt
) {
    public record SaleLineItem(
            int lineNumber,
            Long jewelryItemId,
            String designation,
            BigDecimal grossWeightGrams,
            String fineness,
            int quantity,
            long unitPriceTtcCents,
            String vatRegime,
            boolean isSecondHand
    ) {}
}
