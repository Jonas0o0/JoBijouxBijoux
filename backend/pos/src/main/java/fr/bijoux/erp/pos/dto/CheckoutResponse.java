package fr.bijoux.erp.pos.dto;

import fr.bijoux.erp.pos.domain.model.PosTicketStatus;

import java.time.Instant;
import java.util.List;

public record CheckoutResponse(
        Long ticketId,
        String ticketNumber,
        Long storeId,
        Long totalTtcCents,
        Long totalHtCents,
        Long totalVatCents,
        Long totalChangeGivenCents,
        PosTicketStatus status,
        String signature,
        Instant createdAt,
        List<PaymentSummaryDto> payments
) {
    public record PaymentSummaryDto(
            String paymentMethod,
            long amountCents,
            String transactionReference,
            String status
    ) {}
}
