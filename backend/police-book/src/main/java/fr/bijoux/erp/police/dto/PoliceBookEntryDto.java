package fr.bijoux.erp.police.dto;

import fr.bijoux.erp.police.domain.model.PoliceBookEntry;
import fr.bijoux.erp.police.domain.model.PoliceEntryType;

import java.math.BigDecimal;
import java.time.Instant;

public record PoliceBookEntryDto(
        Long id,
        Long sequenceNumber,
        Long storeId,
        Instant entryDate,
        PoliceEntryType entryType,
        String itemDescription,
        String metalType,
        String fineness,
        BigDecimal grossWeightGrams,
        BigDecimal estimatedNetWeightGrams,
        String hallmarks,
        String sellerFullName,
        String sellerCniPassport,
        String sellerAddress,
        Long purchasePriceCents,
        Instant exitDate,
        String exitTicketNumber,
        String exitReason,
        Long exitPriceCents,
        String currentHash,
        String signature
) {
    public static PoliceBookEntryDto fromEntity(PoliceBookEntry e) {
        return new PoliceBookEntryDto(
                e.getId(),
                e.getSequenceNumber(),
                e.getStoreId(),
                e.getEntryDate(),
                e.getEntryType(),
                e.getItemDescription(),
                e.getMetalType(),
                e.getFineness(),
                e.getGrossWeightGrams(),
                e.getEstimatedNetWeightGrams(),
                e.getHallmarks(),
                e.getSellerFullName(),
                e.getSellerCniPassport(),
                e.getSellerAddress(),
                e.getPurchasePriceCents(),
                e.getExitDate(),
                e.getExitTicketNumber(),
                e.getExitReason(),
                e.getExitPriceCents(),
                e.getCurrentHash(),
                e.getSignature()
        );
    }
}
