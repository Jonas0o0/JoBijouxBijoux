package fr.bijoux.erp.catalog.dto;

import fr.bijoux.erp.catalog.domain.model.SupplierOrder;
import fr.bijoux.erp.catalog.domain.model.SupplierOrderItem;
import fr.bijoux.erp.catalog.domain.model.SupplierOrderStatus;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

public record SupplierOrderResponse(
        Long id,
        String orderNumber,
        Long storeId,
        String supplierName,
        SupplierOrderStatus status,
        String destinationStock,
        Long totalAmountHtCents,
        Long totalVatCents,
        Long totalAmountTtcCents,
        String notes,
        Instant createdAt,
        Instant orderedAt,
        Instant receivedAt,
        List<SupplierOrderItemDto> items
) {
    public record SupplierOrderItemDto(
            Long id,
            String referenceNumber,
            String designation,
            int quantity,
            int receivedQuantity,
            Long unitPurchasePriceHtCents,
            Long totalPurchasePriceHtCents,
            String fineness,
            BigDecimal grossWeightGrams,
            Long sellingPriceTtcCents,
            String vatRegime
    ) {
        public static SupplierOrderItemDto fromEntity(SupplierOrderItem item) {
            return new SupplierOrderItemDto(
                    item.getId(),
                    item.getReferenceNumber(),
                    item.getDesignation(),
                    item.getQuantity(),
                    item.getReceivedQuantity(),
                    item.getUnitPurchasePriceHtCents(),
                    item.getTotalPurchasePriceHtCents(),
                    item.getFineness() != null ? item.getFineness().name() : null,
                    item.getGrossWeightGrams(),
                    item.getSellingPriceTtcCents(),
                    item.getVatRegime() != null ? item.getVatRegime().name() : null
            );
        }
    }

    public static SupplierOrderResponse fromEntity(SupplierOrder order) {
        List<SupplierOrderItemDto> itemDtos = order.getItems() != null
                ? order.getItems().stream().map(SupplierOrderItemDto::fromEntity).toList()
                : List.of();

        return new SupplierOrderResponse(
                order.getId(),
                order.getOrderNumber(),
                order.getStoreId(),
                order.getSupplierName(),
                order.getStatus(),
                order.getDestinationStock(),
                order.getTotalAmountHtCents(),
                order.getTotalVatCents(),
                order.getTotalAmountTtcCents(),
                order.getNotes(),
                order.getCreatedAt(),
                order.getOrderedAt(),
                order.getReceivedAt(),
                itemDtos
        );
    }
}
