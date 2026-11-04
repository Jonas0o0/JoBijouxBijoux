package fr.bijoux.erp.pos.domain.service;

import fr.bijoux.erp.catalog.domain.model.VatRegime;
import fr.bijoux.erp.core.audit.service.FiscalSealingEngine;
import fr.bijoux.erp.core.event.SaleCompletedEvent;
import fr.bijoux.erp.pos.domain.factory.PosTicketFactory;
import fr.bijoux.erp.pos.domain.model.PaymentTransaction;
import fr.bijoux.erp.pos.domain.model.PosTicket;
import fr.bijoux.erp.pos.domain.repository.PosTicketRepository;
import fr.bijoux.erp.pos.domain.strategy.PaymentContext;
import fr.bijoux.erp.pos.domain.strategy.PaymentResult;
import fr.bijoux.erp.pos.domain.strategy.PaymentStrategyRegistry;
import fr.bijoux.erp.pos.dto.CartValidationResult;
import fr.bijoux.erp.pos.dto.CheckoutRequest;
import fr.bijoux.erp.pos.dto.CheckoutResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Service
public class CheckoutService {

    private final PosTicketRepository ticketRepository;
    private final PosTicketFactory ticketFactory;
    private final PaymentStrategyRegistry paymentStrategyRegistry;
    private final VatCalculationService vatCalculationService;
    private final FiscalSealingEngine sealingEngine;
    private final ApplicationEventPublisher eventPublisher;

    @Value("${erp.fiscal.sealing-secret:TESTING_FISCAL_SEALING_KEY_NF525}")
    private String sealingSecret;

    public CheckoutService(PosTicketRepository ticketRepository,
                           PosTicketFactory ticketFactory,
                           PaymentStrategyRegistry paymentStrategyRegistry,
                           VatCalculationService vatCalculationService,
                           FiscalSealingEngine sealingEngine,
                           ApplicationEventPublisher eventPublisher) {
        this.ticketRepository = ticketRepository;
        this.ticketFactory = ticketFactory;
        this.paymentStrategyRegistry = paymentStrategyRegistry;
        this.vatCalculationService = vatCalculationService;
        this.sealingEngine = sealingEngine;
        this.eventPublisher = eventPublisher;
    }

    public CartValidationResult validateCart(List<CheckoutRequest.CartLineDto> lines) {
        if (lines == null || lines.isEmpty()) {
            return CartValidationResult.invalid(List.of("Le panier ne peut pas être vide"));
        }

        long totalTtc = 0L;
        long totalHt = 0L;
        long totalVat = 0L;
        List<String> errors = new ArrayList<>();

        for (CheckoutRequest.CartLineDto line : lines) {
            if (line.quantity() <= 0) {
                errors.add("Quantité invalide pour la ligne " + line.lineNumber());
            }
            if (line.unitPriceTtcCents() < 0) {
                errors.add("Prix unitaire négatif interdit pour la ligne " + line.lineNumber());
            }

            long lineTtc = line.unitPriceTtcCents() * line.quantity();
            VatRegime regime = line.vatRegime() != null ? line.vatRegime() : VatRegime.STANDARD_20;
            var vatRes = vatCalculationService.calculateVat(lineTtc, regime, line.purchasePriceHtCents());

            totalTtc += lineTtc;
            totalHt += vatRes.totalHtCents();
            totalVat += vatRes.vatAmountCents();
        }

        if (!errors.isEmpty()) {
            return CartValidationResult.invalid(errors);
        }

        return CartValidationResult.ok(totalTtc, totalHt, totalVat);
    }

    @Transactional
    public CheckoutResponse processCheckout(CheckoutRequest request) {
        var cartValidation = validateCart(request.lines());
        if (!cartValidation.valid()) {
            throw new IllegalArgumentException("Panier invalide : " + String.join(", ", cartValidation.errors()));
        }

        long totalPaid = request.payments().stream()
                .mapToLong(CheckoutRequest.PaymentDto::amountCents)
                .sum();

        if (totalPaid < cartValidation.totalTtcCents()) {
            throw new IllegalArgumentException(String.format(
                    "Montant total réglé (%.2f €) inférieur au total TTC du panier (%.2f €)",
                    totalPaid / 100.0, cartValidation.totalTtcCents() / 100.0
            ));
        }

        long ticketSequence = ticketRepository.countByStoreId(request.storeId()) + 1L;
        String ticketNumber = String.format("TKT-%d-%06d", request.storeId(), ticketSequence);

        String previousHash = ticketRepository.findTopByStoreIdOrderByCreatedAtDescIdDesc(request.storeId())
                .map(PosTicket::getCurrentHash)
                .orElse(FiscalSealingEngine.GENESIS_ROOT_HASH);

        List<PosTicketFactory.LineBlueprint> blueprints = request.lines().stream()
                .map(l -> new PosTicketFactory.LineBlueprint(
                        l.lineNumber(),
                        l.itemType(),
                        l.jewelryItemId(),
                        l.designation(),
                        l.quantity(),
                        l.unitPriceTtcCents(),
                        l.vatRegime(),
                        l.purchasePriceHtCents()
                ))
                .toList();

        Instant now = Instant.now();
        String payload = String.format("TICKET|%s|%d|%d|%d",
                ticketNumber,
                request.storeId(),
                cartValidation.totalTtcCents(),
                cartValidation.totalVatCents());

        String currentHash = sealingEngine.computeChainHash(previousHash, payload, now, ticketSequence);
        String signature = sealingEngine.sealRecord(sealingSecret, currentHash);

        PosTicket ticket = ticketFactory.createTicket(
                ticketNumber,
                request.storeId(),
                request.operatorUsername(),
                request.customerId(),
                blueprints,
                previousHash,
                currentHash,
                signature
        );

        long totalChangeGiven = 0L;
        List<CheckoutResponse.PaymentSummaryDto> paymentSummaries = new ArrayList<>();

        for (CheckoutRequest.PaymentDto pDto : request.payments()) {
            PaymentContext ctx = new PaymentContext(
                    pDto.paymentMethod(),
                    pDto.amountCents(),
                    pDto.cashReceivedCents(),
                    pDto.tpeAuthToken(),
                    pDto.voucherCode(),
                    pDto.scrapDossierId(),
                    request.customerId(),
                    request.storeId()
            );

            PaymentResult result = paymentStrategyRegistry.executePayment(ctx);
            if (!result.success()) {
                throw new IllegalStateException("Échec du paiement (" + pDto.paymentMethod() + ") : " + result.errorMessage());
            }

            PaymentTransaction tx = new PaymentTransaction(
                    pDto.paymentMethod(),
                    pDto.amountCents(),
                    result.transactionReference(),
                    pDto.tpeAuthToken(),
                    pDto.voucherCode(),
                    pDto.scrapDossierId()
            );
            ticket.addPayment(tx);

            totalChangeGiven += result.changeGivenCents();
            paymentSummaries.add(new CheckoutResponse.PaymentSummaryDto(
                    pDto.paymentMethod().name(),
                    pDto.amountCents(),
                    result.transactionReference(),
                    "APPROVED"
            ));
        }

        PosTicket savedTicket = ticketRepository.save(ticket);

        // Publication de l'événement Spring Modulith SaleCompletedEvent
        List<SaleCompletedEvent.SaleLineItem> eventLines = request.lines().stream()
                .map(l -> new SaleCompletedEvent.SaleLineItem(
                        l.lineNumber(),
                        l.jewelryItemId(),
                        l.designation(),
                        BigDecimal.ZERO,
                        "750‰",
                        l.quantity(),
                        l.unitPriceTtcCents(),
                        l.vatRegime() != null ? l.vatRegime().name() : VatRegime.STANDARD_20.name(),
                        l.isSecondHand()
                ))
                .toList();

        SaleCompletedEvent event = new SaleCompletedEvent(
                savedTicket.getId(),
                savedTicket.getTicketNumber(),
                savedTicket.getStoreId(),
                savedTicket.getOperatorUsername(),
                savedTicket.getCustomerId(),
                savedTicket.getTotalTtcCents(),
                savedTicket.getTotalVatCents(),
                eventLines,
                now
        );
        eventPublisher.publishEvent(event);

        return new CheckoutResponse(
                savedTicket.getId(),
                savedTicket.getTicketNumber(),
                savedTicket.getStoreId(),
                savedTicket.getTotalTtcCents(),
                savedTicket.getTotalHtCents(),
                savedTicket.getTotalVatCents(),
                totalChangeGiven,
                savedTicket.getStatus(),
                savedTicket.getSignature(),
                savedTicket.getCreatedAt(),
                paymentSummaries
        );
    }
}
