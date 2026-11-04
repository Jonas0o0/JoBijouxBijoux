package fr.bijoux.erp.pos.domain.closure;

import fr.bijoux.erp.pos.domain.model.FiscalClosureType;
import java.time.Instant;

public record ClosureContext(
        Long storeId,
        String operatorUsername,
        FiscalClosureType closureType,
        Instant periodStart,
        Instant periodEnd
) {}
