package fr.bijoux.erp.gold.dto;

import fr.bijoux.erp.gold.domain.model.GoldPaymentMethod;
import fr.bijoux.erp.gold.domain.model.GoldRepurchaseDossier;
import fr.bijoux.erp.gold.domain.model.GoldRepurchaseStatus;
import fr.bijoux.erp.gold.domain.model.GoldTaxRegime;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

public record GoldDossierResponse(
        Long id,
        String dossierNumber,
        Long storeId,
        String operatorUsername,
        Long customerId,
        String sellerFullName,
        String sellerCniPassport,
        GoldRepurchaseStatus status,
        GoldPaymentMethod paymentMethod,
        BigDecimal totalGrossWeightGrams,
        BigDecimal totalEstimatedNetWeightGrams,
        Long totalGrossAmountCents,
        GoldTaxRegime taxStrategy,
        Long taxAmountCents,
        Long netPayableToSellerCents,
        Instant signedAt,
        Instant coolingOffEndsAt,
        Instant finalizedAt,
        Instant createdAt,
        List<GoldScrapItemDetail> items
) {
    public record GoldScrapItemDetail(
            Long id,
            String description,
            String metalType,
            String fineness,
            BigDecimal grossWeightGrams,
            BigDecimal estimatedNetWeightGrams,
            BigDecimal purityRate,
            Long unitPricePerGramCents,
            Long totalPriceCents
    ) {}

    public static GoldDossierResponse fromEntity(GoldRepurchaseDossier d) {
        List<GoldScrapItemDetail> itemDtos = d.getItems().stream()
                .map(i -> new GoldScrapItemDetail(
                        i.getId(),
                        i.getDescription(),
                        i.getMetalType(),
                        i.getFineness(),
                        i.getGrossWeightGrams(),
                        i.getEstimatedNetWeightGrams(),
                        i.getPurityRate(),
                        i.getUnitPricePerGramCents(),
                        i.getTotalPriceCents()
                ))
                .toList();

        return new GoldDossierResponse(
                d.getId(),
                d.getDossierNumber(),
                d.getStoreId(),
                d.getOperatorUsername(),
                d.getCustomerId(),
                d.getSellerFullName(),
                d.getSellerCniPassport(),
                d.getStatus(),
                d.getPaymentMethod(),
                d.getTotalGrossWeightGrams(),
                d.getTotalEstimatedNetWeightGrams(),
                d.getTotalGrossAmountCents(),
                d.getTaxStrategy(),
                d.getTaxAmountCents(),
                d.getNetPayableToSellerCents(),
                d.getSignedAt(),
                d.getCoolingOffEndsAt(),
                d.getFinalizedAt(),
                d.getCreatedAt(),
                itemDtos
        );
    }
}
