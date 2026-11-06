package fr.bijoux.erp.workshop.dto;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

/**
 * DTO de décompte de facturation SAV / Atelier joaillerie.
 * Détaille la main d'œuvre (façon joaillière), les fournitures (or/pierres/rhodiage),
 * l'acompte déjà versé et le solde net restant dû.
 */
public record RepairInvoiceDto(
        Long repairOrderId,
        String orderNumber,
        Long storeId,
        Long customerId,
        String itemDescription,
        String metalType,
        String fineness,
        BigDecimal grossWeightGrams,
        Long totalCostCents,
        Long depositPaidCents,
        Long remainingBalanceCents,
        LaborDetailDto labor,
        List<SupplyDetailDto> supplies,
        String status,
        Instant invoiceDate
) {
    public record LaborDetailDto(
            String description,
            Long amountCents
    ) {}

    public record SupplyDetailDto(
            String componentName,
            int quantity,
            Long unitCostCents,
            Long totalCostCents
    ) {}
}
