package fr.bijoux.erp.core.event;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

/**
 * Événement métier déclenché lors de la validation d'un rachat d'or aux particuliers.
 * Écouté par les modules PoliceBook (inscription Livre de Police) et WeightAccount (crédit compte-poids).
 */
public record GoldRepurchasedEvent(
        Long dossierId,
        String dossierNumber,
        Long storeId,
        String operatorUsername,
        Long customerId,
        String sellerFullName,
        String sellerCniPassport,
        String sellerAddress,
        BigDecimal totalGrossWeightGrams,
        BigDecimal totalEstimatedNetWeightGrams,
        Long netPayableCents,
        List<GoldScrapRecord> items,
        Instant coolingOffEndsAt,
        Instant occurredAt
) {
    public record GoldScrapRecord(
            String description,
            String metalType,
            String fineness,
            BigDecimal grossWeightGrams,
            BigDecimal estimatedNetWeightGrams,
            BigDecimal purityRate,
            Long totalPriceCents
    ) {}
}
