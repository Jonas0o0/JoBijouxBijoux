package fr.bijoux.erp.catalog.event;

import fr.bijoux.erp.catalog.domain.model.JewelryItemStatus;
import fr.bijoux.erp.catalog.domain.service.JewelryCatalogService;
import fr.bijoux.erp.core.event.SaleCompletedEvent;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.modulith.events.ApplicationModuleListener;
import org.springframework.stereotype.Component;

/**
 * Listener Spring Modulith observant les ventes caisse pour actualiser le stock joaillier.
 */
@Component
public class CatalogSaleEventListener {

    private static final Logger log = LoggerFactory.getLogger(CatalogSaleEventListener.class);
    private final JewelryCatalogService catalogService;

    public CatalogSaleEventListener(JewelryCatalogService catalogService) {
        this.catalogService = catalogService;
    }

    @ApplicationModuleListener
    public void onSaleCompleted(SaleCompletedEvent event) {
        log.info("Traitement de l'événement SaleCompletedEvent pour le ticket {}", event.ticketNumber());
        for (SaleCompletedEvent.SaleLineItem line : event.lines()) {
            if (line.jewelryItemId() != null) {
                try {
                    catalogService.updateStatus(
                            line.jewelryItemId(),
                            JewelryItemStatus.VENDU,
                            event.operatorUsername(),
                            "Sortie caisse validée - Ticket " + event.ticketNumber()
                    );
                    log.info("Bijou id={} marqué comme VENDU suite au ticket {}", line.jewelryItemId(), event.ticketNumber());
                } catch (Exception e) {
                    log.error("Erreur lors de la mise à jour du statut pour le bijou id={} : {}", line.jewelryItemId(), e.getMessage());
                }
            }
        }
    }
}
