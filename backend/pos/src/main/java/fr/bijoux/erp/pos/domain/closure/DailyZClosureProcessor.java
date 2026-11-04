package fr.bijoux.erp.pos.domain.closure;

import com.fasterxml.jackson.databind.ObjectMapper;
import fr.bijoux.erp.core.audit.service.FiscalSealingEngine;
import fr.bijoux.erp.pos.domain.repository.FiscalClosureRepository;
import fr.bijoux.erp.pos.domain.repository.PosTicketRepository;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;

/**
 * Clôture Fiscale Journalière (Ticket Z) - Obligation NF525.
 * Calcule les ventes du jour, incrémente le compteur journalier et cumule le Grand Total.
 */
@Component
public class DailyZClosureProcessor extends AbstractFiscalClosureTemplate {

    public DailyZClosureProcessor(PosTicketRepository ticketRepository,
                                  FiscalClosureRepository closureRepository,
                                  FiscalSealingEngine sealingEngine,
                                  ObjectMapper objectMapper) {
        super(ticketRepository, closureRepository, sealingEngine, objectMapper);
    }

    @Override
    protected void validateClosurePrerequisites(ClosureContext context) {
        if (context.storeId() == null) {
            throw new IllegalArgumentException("Le point de vente (storeId) est obligatoire pour le Ticket Z");
        }
    }

    @Override
    protected boolean shouldPersistClosure() {
        return true;
    }

    @Override
    protected Instant determinePeriodStart(ClosureContext context) {
        LocalDate today = LocalDate.now(ZoneId.of("Europe/Paris"));
        return today.atStartOfDay(ZoneId.of("Europe/Paris")).toInstant();
    }

    @Override
    protected Instant determinePeriodEnd(ClosureContext context) {
        return Instant.now();
    }
}
