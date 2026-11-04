package fr.bijoux.erp.pos.domain.strategy;

import fr.bijoux.erp.pos.domain.model.PaymentMethod;
import org.springframework.stereotype.Component;

import java.util.UUID;

/**
 * Strategy de règlement par Carte Bancaire via terminal de paiement électronique (TPE).
 */
@Component
public class CardPaymentStrategy implements PaymentStrategy {

    @Override
    public PaymentMethod getPaymentMethod() {
        return PaymentMethod.CARD;
    }

    @Override
    public PaymentResult processPayment(PaymentContext context) {
        if (context.amountCents() <= 0) {
            return PaymentResult.failure("Le montant du règlement par carte doit être strictement positif");
        }

        // Si le token TPE n'est pas fourni, nous générons un jeton de transaction TPE standard
        String token = (context.tpeAuthToken() != null && !context.tpeAuthToken().isBlank())
                ? context.tpeAuthToken()
                : "TPE-AUTH-" + UUID.randomUUID().toString().substring(0, 12).toUpperCase();

        String reference = "CB-" + token;
        return PaymentResult.success(reference, 0L);
    }
}
