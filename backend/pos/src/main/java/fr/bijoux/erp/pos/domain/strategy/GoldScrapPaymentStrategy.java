package fr.bijoux.erp.pos.domain.strategy;

import fr.bijoux.erp.pos.domain.model.PaymentMethod;
import org.springframework.stereotype.Component;

/**
 * Strategy de règlement par compensation de rachat d'or / métaux précieux (reprise).
 */
@Component
public class GoldScrapPaymentStrategy implements PaymentStrategy {

    @Override
    public PaymentMethod getPaymentMethod() {
        return PaymentMethod.GOLD_SCRAP;
    }

    @Override
    public PaymentResult processPayment(PaymentContext context) {
        if (context.amountCents() <= 0) {
            return PaymentResult.failure("Le montant de compensation rachat d'or doit être strictement positif");
        }

        if (context.scrapDossierId() == null) {
            return PaymentResult.failure("L'identifiant du dossier de reprise d'or (scrapDossierId) est obligatoire");
        }

        String reference = "GOLD-REPRISE-" + context.scrapDossierId();
        return PaymentResult.success(reference, 0L);
    }
}
