package fr.bijoux.erp.pos.domain.closure;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import fr.bijoux.erp.core.audit.service.FiscalSealingEngine;
import fr.bijoux.erp.pos.domain.model.FiscalClosure;
import fr.bijoux.erp.pos.domain.model.FiscalClosureType;
import fr.bijoux.erp.pos.domain.model.PaymentTransaction;
import fr.bijoux.erp.pos.domain.model.PosTicket;
import fr.bijoux.erp.pos.domain.model.PosTicketLine;
import fr.bijoux.erp.pos.domain.repository.FiscalClosureRepository;
import fr.bijoux.erp.pos.domain.repository.PosTicketRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Template Method Pattern (GoF) pour les clôtures de caisse fiscales (NF525).
 * Standardise les étapes de calcul du Grand Total cumulatif, d'agrégation et de scellement HMAC-SHA256.
 */
public abstract class AbstractFiscalClosureTemplate {

    protected final PosTicketRepository ticketRepository;
    protected final FiscalClosureRepository closureRepository;
    protected final FiscalSealingEngine sealingEngine;
    protected final ObjectMapper objectMapper;

    @Value("${erp.fiscal.sealing-secret:TESTING_FISCAL_SEALING_KEY_NF525}")
    protected String sealingSecret;

    protected AbstractFiscalClosureTemplate(PosTicketRepository ticketRepository,
                                            FiscalClosureRepository closureRepository,
                                            FiscalSealingEngine sealingEngine,
                                            ObjectMapper objectMapper) {
        this.ticketRepository = ticketRepository;
        this.closureRepository = closureRepository;
        this.sealingEngine = sealingEngine;
        this.objectMapper = objectMapper;
    }

    /**
     * Méthode modèle (Template Method) définissant le squelette de l'algorithme de clôture.
     */
    @Transactional
    public FiscalClosure executeClosure(ClosureContext context) {
        validateClosurePrerequisites(context);

        Instant start = (context.periodStart() != null) ? context.periodStart() : determinePeriodStart(context);
        Instant end = (context.periodEnd() != null) ? context.periodEnd() : determinePeriodEnd(context);

        List<PosTicket> tickets = ticketRepository.findCompletedTicketsBetween(context.storeId(), start, end);
        ClosureAggregation aggregation = aggregateTotals(tickets);

        long grandTotalCumulative = computeCumulativeGrandTotal(context.storeId(), aggregation.totalTtcCents());
        long sequenceNumber = determineSequenceNumber(context.storeId(), context.closureType());

        String vatJson = toJson(aggregation.vatBreakdown());
        String paymentJson = toJson(aggregation.paymentBreakdown());

        String previousHash = determinePreviousHash(context.storeId());
        Instant now = Instant.now();

        String payload = String.format("CLOSURE|%s|%d|%d|%d|%d|%d",
                context.closureType().name(),
                sequenceNumber,
                context.storeId(),
                aggregation.totalTtcCents(),
                aggregation.totalVatCents(),
                grandTotalCumulative);

        long hashSequence = sequenceNumber > 0 ? sequenceNumber : 1L;
        String currentHash = sealingEngine.computeChainHash(previousHash, payload, now, hashSequence);
        String signature = sealingEngine.sealRecord(sealingSecret, currentHash);

        FiscalClosure closure = new FiscalClosure(
                context.closureType(),
                sequenceNumber,
                context.storeId(),
                context.operatorUsername(),
                start,
                end,
                aggregation.totalTtcCents(),
                aggregation.totalHtCents(),
                aggregation.totalVatCents(),
                vatJson,
                paymentJson,
                grandTotalCumulative,
                previousHash,
                currentHash,
                signature
        );

        if (shouldPersistClosure()) {
            closure = closureRepository.save(closure);
        }

        postClosureHook(closure, tickets);

        return closure;
    }

    protected abstract void validateClosurePrerequisites(ClosureContext context);

    protected abstract boolean shouldPersistClosure();

    protected abstract Instant determinePeriodStart(ClosureContext context);

    protected abstract Instant determinePeriodEnd(ClosureContext context);

    protected void postClosureHook(FiscalClosure closure, List<PosTicket> tickets) {
        // Extension possible (ex: archivage ou notification)
    }

    protected ClosureAggregation aggregateTotals(List<PosTicket> tickets) {
        long totalTtc = 0L;
        long totalHt = 0L;
        long totalVat = 0L;
        Map<String, Long> vatBreakdown = new HashMap<>();
        Map<String, Long> paymentBreakdown = new HashMap<>();

        for (PosTicket ticket : tickets) {
            totalTtc += ticket.getTotalTtcCents();
            totalHt += ticket.getTotalHtCents();
            totalVat += ticket.getTotalVatCents();

            for (PosTicketLine line : ticket.getLines()) {
                String rateKey = line.getVatRate().toPlainString() + "%";
                vatBreakdown.merge(rateKey, line.getVatAmountCents(), Long::sum);
            }

            for (PaymentTransaction payment : ticket.getPayments()) {
                paymentBreakdown.merge(payment.getPaymentMethod().name(), payment.getAmountCents(), Long::sum);
            }
        }

        return new ClosureAggregation(totalTtc, totalHt, totalVat, vatBreakdown, paymentBreakdown, tickets.size());
    }

    protected long computeCumulativeGrandTotal(Long storeId, long periodTotalTtc) {
        return closureRepository.findTopByStoreIdOrderByCreatedAtDescIdDesc(storeId)
                .map(last -> last.getGrandTotalCumulativeCents() + periodTotalTtc)
                .orElse(periodTotalTtc);
    }

    protected long determineSequenceNumber(Long storeId, FiscalClosureType type) {
        if (!shouldPersistClosure()) {
            return 0L; // Ticket X non numéroté
        }
        return closureRepository.findMaxSequenceNumber(storeId, type) + 1L;
    }

    protected String determinePreviousHash(Long storeId) {
        return closureRepository.findTopByStoreIdOrderByCreatedAtDescIdDesc(storeId)
                .map(FiscalClosure::getCurrentHash)
                .orElse(FiscalSealingEngine.GENESIS_ROOT_HASH);
    }

    private String toJson(Object obj) {
        try {
            return objectMapper.writeValueAsString(obj);
        } catch (JsonProcessingException e) {
            return "{}";
        }
    }
}
