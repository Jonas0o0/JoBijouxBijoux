package fr.bijoux.erp.pos.domain.strategy;

import fr.bijoux.erp.pos.domain.model.PaymentMethod;

/**
 * Strategy Pattern (GoF / SOLID Open-Closed Principle) pour les différents modes de règlement.
 */
public interface PaymentStrategy {

    PaymentMethod getPaymentMethod();

    PaymentResult processPayment(PaymentContext context);
}
