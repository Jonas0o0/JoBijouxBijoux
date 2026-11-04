package fr.bijoux.erp.catalog.domain.factory;

import fr.bijoux.erp.catalog.domain.model.JewelryItem;
import fr.bijoux.erp.catalog.domain.model.StorageLocation;
import fr.bijoux.erp.catalog.domain.model.VatRegime;
import fr.bijoux.erp.core.domain.valueobject.GoldFineness;
import fr.bijoux.erp.core.domain.valueobject.MoneyAmount;
import fr.bijoux.erp.core.domain.valueobject.WeightInGrams;
import org.springframework.stereotype.Component;

/**
 * Factory Pattern pour l'instanciation normalisée et sécurisée des pièces joaillières.
 */
@Component
public class JewelryItemFactory {

    public JewelryItem createItem(
            String serialNumber,
            String referenceNumber,
            String designation,
            GoldFineness fineness,
            WeightInGrams grossWeight,
            WeightInGrams estimatedNetWeight,
            MoneyAmount sellingPriceTtc,
            MoneyAmount purchasePriceHt,
            VatRegime vatRegime,
            Long storeId,
            StorageLocation location
    ) {
        JewelryItem item = new JewelryItem(
                serialNumber,
                referenceNumber,
                designation,
                fineness,
                grossWeight,
                sellingPriceTtc,
                purchasePriceHt,
                vatRegime != null ? vatRegime : VatRegime.STANDARD_20,
                storeId
        );
        if (estimatedNetWeight != null) {
            item.setEstimatedNetWeight(estimatedNetWeight);
        }
        if (location != null) {
            item.setStorageLocation(location);
        }
        return item;
    }
}
