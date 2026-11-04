package fr.bijoux.erp.pos.dto;

import fr.bijoux.erp.pos.domain.model.FiscalClosure;
import fr.bijoux.erp.pos.domain.model.FiscalClosureType;

import java.time.Instant;

public record FiscalClosureDto(
        Long id,
        FiscalClosureType closureType,
        Long sequenceNumber,
        Long storeId,
        String operatorUsername,
        Instant openingDate,
        Instant closingDate,
        Long totalTtcCents,
        Long totalHtCents,
        Long totalVatCents,
        String vatBreakdownJson,
        String paymentBreakdownJson,
        Long grandTotalCumulativeCents,
        String signature,
        Instant createdAt
) {
    public static FiscalClosureDto fromEntity(FiscalClosure entity) {
        return new FiscalClosureDto(
                entity.getId(),
                entity.getClosureType(),
                entity.getSequenceNumber(),
                entity.getStoreId(),
                entity.getOperatorUsername(),
                entity.getOpeningDate(),
                entity.getClosingDate(),
                entity.getTotalTtcCents(),
                entity.getTotalHtCents(),
                entity.getTotalVatCents(),
                entity.getVatBreakdownJson(),
                entity.getPaymentBreakdownJson(),
                entity.getGrandTotalCumulativeCents(),
                entity.getSignature(),
                entity.getCreatedAt()
        );
    }
}
