package fr.bijoux.erp.pos.domain.strategy;

import fr.bijoux.erp.pos.domain.model.PaymentMethod;
import org.springframework.stereotype.Component;

import java.util.UUID;

/**
 * Strategy de règlement par Bon d'Achat, Avoir ou Chèque Cadeau.
 */
@Component
public class VoucherPaymentStrategy implements PaymentStrategy {

    @Override
    public PaymentMethod getPaymentMethod() {
        return PaymentMethod.VOUCHER;
    }

    @Override
    public PaymentResult processPayment(PaymentContext context) {
        if (context.amountCents() <= 0) {
            return PaymentResult.failure("Le montant du bon d'achat doit être strictement positif");
        }

        String voucherCode = context.voucherCode();
        if (voucherCode == null || voucherCode.isBlank()) {
            return PaymentResult.failure("Le code du bon d'achat/avoir est obligatoire pour ce mode de règlement");
        }

        String reference = "VOUCH-" + voucherCode.trim().toUpperCase();
        return PaymentResult.success(reference, 0L);
    }
}
