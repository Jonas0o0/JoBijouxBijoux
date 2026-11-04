package fr.bijoux.erp.pos.domain.closure;

import com.fasterxml.jackson.databind.ObjectMapper;
import fr.bijoux.erp.core.audit.service.FiscalSealingEngine;
import fr.bijoux.erp.pos.domain.repository.FiscalClosureRepository;
import fr.bijoux.erp.pos.domain.repository.PosTicketRepository;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.time.YearMonth;
import java.time.ZoneId;

/**
 * Clôture Fiscale Mensuelle (Z Mensuel) - NF525.
 */
@Component
public class MonthlyMClosureProcessor extends AbstractFiscalClosureTemplate {

    public MonthlyMClosureProcessor(PosTicketRepository ticketRepository,
                                    FiscalClosureRepository closureRepository,
                                    FiscalSealingEngine sealingEngine,
                                    ObjectMapper objectMapper) {
        super(ticketRepository, closureRepository, sealingEngine, objectMapper);
    }

    @Override
    protected void validateClosurePrerequisites(ClosureContext context) {
        if (context.storeId() == null) {
            throw new IllegalArgumentException("Le point de vente (storeId) est obligatoire pour le Z Mensuel");
        }
    }

    @Override
    protected boolean shouldPersistClosure() {
        return true;
    }

    @Override
    protected Instant determinePeriodStart(ClosureContext context) {
        YearMonth currentMonth = YearMonth.now(ZoneId.of("Europe/Paris"));
        return currentMonth.atDay(1).atStartOfDay(ZoneId.of("Europe/Paris")).toInstant();
    }

    @Override
    protected Instant determinePeriodEnd(ClosureContext context) {
        return Instant.now();
    }
}
