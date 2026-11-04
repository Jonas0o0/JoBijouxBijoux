package fr.bijoux.erp.pos.domain.service;

import fr.bijoux.erp.pos.domain.closure.ClosureContext;
import fr.bijoux.erp.pos.domain.closure.DailyZClosureProcessor;
import fr.bijoux.erp.pos.domain.closure.InterimXClosureProcessor;
import fr.bijoux.erp.pos.domain.closure.MonthlyMClosureProcessor;
import fr.bijoux.erp.pos.domain.closure.AnnualAClosureProcessor;
import fr.bijoux.erp.pos.domain.model.FiscalClosure;
import fr.bijoux.erp.pos.domain.model.FiscalClosureType;
import org.springframework.stereotype.Service;

@Service
public class FiscalClosureService {

    private final DailyZClosureProcessor dailyZProcessor;
    private final InterimXClosureProcessor interimXProcessor;
    private final MonthlyMClosureProcessor monthlyMProcessor;
    private final AnnualAClosureProcessor annualAProcessor;

    public FiscalClosureService(DailyZClosureProcessor dailyZProcessor,
                                InterimXClosureProcessor interimXProcessor,
                                MonthlyMClosureProcessor monthlyMProcessor,
                                AnnualAClosureProcessor annualAProcessor) {
        this.dailyZProcessor = dailyZProcessor;
        this.interimXProcessor = interimXProcessor;
        this.monthlyMProcessor = monthlyMProcessor;
        this.annualAProcessor = annualAProcessor;
    }

    public FiscalClosure executeDailyZ(Long storeId, String operatorUsername) {
        ClosureContext context = new ClosureContext(storeId, operatorUsername, FiscalClosureType.JOURNALIER_Z, null, null);
        return dailyZProcessor.executeClosure(context);
    }

    public FiscalClosure executeInterimX(Long storeId, String operatorUsername) {
        ClosureContext context = new ClosureContext(storeId, operatorUsername, FiscalClosureType.INTERIM_X, null, null);
        return interimXProcessor.executeClosure(context);
    }

    public FiscalClosure executeMonthlyM(Long storeId, String operatorUsername) {
        ClosureContext context = new ClosureContext(storeId, operatorUsername, FiscalClosureType.MENSUEL_M, null, null);
        return monthlyMProcessor.executeClosure(context);
    }

    public FiscalClosure executeAnnualA(Long storeId, String operatorUsername) {
        ClosureContext context = new ClosureContext(storeId, operatorUsername, FiscalClosureType.ANNUEL_A, null, null);
        return annualAProcessor.executeClosure(context);
    }
}
