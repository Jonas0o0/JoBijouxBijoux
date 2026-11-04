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
 * Lecture de Caisse Intermédiaire (Ticket X) - NF525.
 * Ne clôture pas la journée, ne consomme pas de numéro d'ordre gapless et n'est pas persisté.
 */
@Component
public class InterimXClosureProcessor extends AbstractFiscalClosureTemplate {

    public InterimXClosureProcessor(PosTicketRepository ticketRepository,
                                   FiscalClosureRepository closureRepository,
                                   FiscalSealingEngine sealingEngine,
                                   ObjectMapper objectMapper) {
        super(ticketRepository, closureRepository, sealingEngine, objectMapper);
    }

    @Override
    protected void validateClosurePrerequisites(ClosureContext context) {
        if (context.storeId() == null) {
            throw new IllegalArgumentException("Le point de vente (storeId) est obligatoire pour le Ticket X");
        }
    }

    @Override
    protected boolean shouldPersistClosure() {
        return false;
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
