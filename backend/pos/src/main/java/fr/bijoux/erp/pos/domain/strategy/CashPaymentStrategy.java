package fr.bijoux.erp.pos.domain.strategy;

import fr.bijoux.erp.pos.domain.model.PaymentMethod;
import org.springframework.stereotype.Component;

import java.util.UUID;

/**
 * Strategy de règlement en Espèces (Cash).
 * Applique la règle légale stricte du plafonnement à 1 000 € (Art. L112-6 du CMF).
 */
@Component
public class CashPaymentStrategy implements PaymentStrategy {

    public static final long LEGAL_CASH_LIMIT_CENTS = 100_000L; // 1 000,00 €

    @Override
    public PaymentMethod getPaymentMethod() {
        return PaymentMethod.CASH;
    }

    @Override
    public PaymentResult processPayment(PaymentContext context) {
        if (context.amountCents() <= 0) {
            return PaymentResult.failure("Le montant du règlement en espèces doit être strictement positif");
        }

        if (context.amountCents() > LEGAL_CASH_LIMIT_CENTS) {
            throw new IllegalArgumentException(
                    String.format("Paiement en espèces de %.2f € supérieur au plafond légal strict de 1 000 € interdit (Art. L112-6 CMF)",
                            context.amountCents() / 100.0)
            );
        }

        long cashReceived = context.cashReceivedCents() != null ? context.cashReceivedCents() : context.amountCents();
        if (cashReceived < context.amountCents()) {
            return PaymentResult.failure(
                    String.format("Montant espèces remis insuffisant : reçu %.2f €, dû %.2f €",
                            cashReceived / 100.0, context.amountCents() / 100.0)
            );
        }

        long changeGiven = cashReceived - context.amountCents();
        String reference = "CASH-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();

        return PaymentResult.success(reference, changeGiven);
    }
}
