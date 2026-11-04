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
 * Clôture Fiscale Annuelle (Z Annuel) - NF525.
 */
@Component
public class AnnualAClosureProcessor extends AbstractFiscalClosureTemplate {

    public AnnualAClosureProcessor(PosTicketRepository ticketRepository,
                                  FiscalClosureRepository closureRepository,
                                  FiscalSealingEngine sealingEngine,
                                  ObjectMapper objectMapper) {
        super(ticketRepository, closureRepository, sealingEngine, objectMapper);
    }

    @Override
    protected void validateClosurePrerequisites(ClosureContext context) {
        if (context.storeId() == null) {
            throw new IllegalArgumentException("Le point de vente (storeId) est obligatoire pour le Z Annuel");
        }
    }

    @Override
    protected boolean shouldPersistClosure() {
        return true;
    }

    @Override
    protected Instant determinePeriodStart(ClosureContext context) {
        int currentYear = LocalDate.now(ZoneId.of("Europe/Paris")).getYear();
        return LocalDate.of(currentYear, 1, 1).atStartOfDay(ZoneId.of("Europe/Paris")).toInstant();
    }

    @Override
    protected Instant determinePeriodEnd(ClosureContext context) {
        return Instant.now();
    }
}
