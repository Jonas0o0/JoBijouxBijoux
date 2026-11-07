package fr.bijoux.erp.catalog.dto;

import fr.bijoux.erp.catalog.domain.model.JewelryItem;
import fr.bijoux.erp.catalog.domain.model.JewelryItemStatus;

public record JewelryItemSummaryDto(
        Long id,
        String serialNumber,
        String referenceNumber,
        String designation,
        String fineness,
        Double grossWeightGrams,
        Long sellingPriceTtcCents,
        String taxRegime,
        JewelryItemStatus status,
        Long storeId,
        String locationName
) {
    public static JewelryItemSummaryDto fromEntity(JewelryItem item) {
        if (item == null) {
            return null;
        }
        return new JewelryItemSummaryDto(
                item.getId(),
                item.getSerialNumber(),
                item.getReferenceNumber(),
                item.getDesignation(),
                item.getFineness() != null ? item.getFineness().name() : null,
                item.getGrossWeight() != null ? item.getGrossWeight().value().doubleValue() : null,
                item.getSellingPriceTtc() != null ? item.getSellingPriceTtc().cents() : null,
                item.getTaxRegime() != null ? item.getTaxRegime().name() : null,
                item.getStatus(),
                item.getStoreId(),
                item.getStorageLocation() != null ? item.getStorageLocation().getName() : null
        );
    }
}
