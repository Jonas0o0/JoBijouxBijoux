package fr.bijoux.erp.pos.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;

import java.util.List;

/**
 * Requête d'encaissement direct d'une réparation SAV au comptoir de vente.
 * Impute automatiquement l'acompte déjà versé et clôture la fiche SAV en LIVRE_ET_FACTURE.
 */
public record CheckoutRepairRequest(
        @NotNull(message = "L'identifiant de la fiche de réparation est obligatoire")
        Long repairOrderId,

        @NotNull(message = "Le point de vente (storeId) est obligatoire")
        Long storeId,

        @NotNull(message = "L'opérateur caisse est obligatoire")
        String operatorUsername,

        Long customerId,

        @NotEmpty(message = "Au moins un mode de règlement est obligatoire pour le solde restant")
        @Valid
        List<CheckoutRequest.PaymentDto> payments
) {}
