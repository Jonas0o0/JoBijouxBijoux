package fr.bijoux.erp.gold.domain.strategy;

import fr.bijoux.erp.gold.domain.model.GoldTaxRegime;
import org.springframework.stereotype.Component;

import java.util.EnumMap;
import java.util.List;
import java.util.Map;

@Component
public class GoldTaxStrategyRegistry {

    private final Map<GoldTaxRegime, GoldTaxCalculationStrategy> strategies = new EnumMap<>(GoldTaxRegime.class);

    public GoldTaxStrategyRegistry(List<GoldTaxCalculationStrategy> strategyList) {
        for (GoldTaxCalculationStrategy strategy : strategyList) {
            strategies.put(strategy.getRegime(), strategy);
        }
    }

    public GoldTaxCalculationStrategy getStrategy(GoldTaxRegime regime) {
        GoldTaxCalculationStrategy strategy = strategies.get(regime);
        if (strategy == null) {
            throw new UnsupportedOperationException("Aucune stratégie fiscale trouvée pour le régime : " + regime);
        }
        return strategy;
    }

    public GoldTaxCalculationResult calculateTax(GoldTaxRegime regime, GoldTaxContext context) {
        return getStrategy(regime).calculateTax(context);
    }
}
