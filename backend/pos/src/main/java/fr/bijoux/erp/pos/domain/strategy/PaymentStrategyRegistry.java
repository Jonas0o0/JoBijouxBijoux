package fr.bijoux.erp.pos.domain.strategy;

import fr.bijoux.erp.pos.domain.model.PaymentMethod;
import org.springframework.stereotype.Component;

import java.util.EnumMap;
import java.util.List;
import java.util.Map;

/**
 * Registre des stratégies de paiement (Open-Closed Principle).
 * Permet d'ajouter de nouvelles stratégies sans modifier le service d'encaissement.
 */
@Component
public class PaymentStrategyRegistry {

    private final Map<PaymentMethod, PaymentStrategy> strategies = new EnumMap<>(PaymentMethod.class);

    public PaymentStrategyRegistry(List<PaymentStrategy> strategyList) {
        for (PaymentStrategy strategy : strategyList) {
            strategies.put(strategy.getPaymentMethod(), strategy);
        }
    }

    public PaymentStrategy getStrategy(PaymentMethod method) {
        PaymentStrategy strategy = strategies.get(method);
        if (strategy == null) {
            throw new UnsupportedOperationException("Aucune stratégie de règlement enregistrée pour le mode : " + method);
        }
        return strategy;
    }

    public PaymentResult executePayment(PaymentContext context) {
        return getStrategy(context.paymentMethod()).processPayment(context);
    }
}
