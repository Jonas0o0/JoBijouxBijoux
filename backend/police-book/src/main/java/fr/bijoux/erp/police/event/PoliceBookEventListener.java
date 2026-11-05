package fr.bijoux.erp.police.event;

import fr.bijoux.erp.core.event.GoldRepurchasedEvent;
import fr.bijoux.erp.core.event.SaleCompletedEvent;
import fr.bijoux.erp.police.domain.model.PoliceBookEntry;
import fr.bijoux.erp.police.domain.model.PoliceEntryType;
import fr.bijoux.erp.police.domain.service.PoliceBookService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.modulith.events.ApplicationModuleListener;
import org.springframework.stereotype.Component;

import java.util.List;

/**
 * Listener Spring Modulith observant les événements de vente et de rachat d'or
 * pour alimenter automatiquement le Livre de Police inaltérable (CGI art. 537/538).
 */
@Component
public class PoliceBookEventListener {

    private static final Logger log = LoggerFactory.getLogger(PoliceBookEventListener.class);
    private final PoliceBookService policeBookService;

    public PoliceBookEventListener(PoliceBookService policeBookService) {
        this.policeBookService = policeBookService;
    }

    /**
     * Traite les sorties lors d'une vente en caisse d'objets d'occasion (dépôt-vente / seconde main).
     */
    @ApplicationModuleListener
    public void onSaleCompleted(SaleCompletedEvent event) {
        for (SaleCompletedEvent.SaleLineItem line : event.lines()) {
            if (line.isSecondHand()) {
                log.info("Vente d'un objet d'occasion détectée : {} (ticket {})", line.designation(), event.ticketNumber());
                List<PoliceBookEntry> openEntries = policeBookService.getOpenEntriesByStore(event.storeId());
                openEntries.stream()
                        .filter(e -> e.getItemDescription().equalsIgnoreCase(line.designation()))
                        .findFirst()
                        .ifPresent(entry -> {
                            policeBookService.recordExit(
                                    entry.getId(),
                                    event.occurredAt(),
                                    event.ticketNumber(),
                                    "VENTE_OCCASION",
                                    line.unitPriceTtcCents()
                            );
                            log.info("Sortie enregistrée dans le Livre de Police n° d'ordre {} pour ticket {}",
                                    entry.getSequenceNumber(), event.ticketNumber());
                        });
            }
        }
    }

    /**
     * Inscrit automatiquement chaque pièce d'or ou lot racheté dans le Livre de Police.
     */
    @ApplicationModuleListener
    public void onGoldRepurchased(GoldRepurchasedEvent event) {
        log.info("Rachat d'or validé pour le dossier {} - Inscription au Livre de Police", event.dossierNumber());

        for (GoldRepurchasedEvent.GoldScrapRecord item : event.items()) {
            policeBookService.recordEntry(
                    event.storeId(),
                    PoliceEntryType.REPRISE_OR,
                    item.description() + " [Dossier " + event.dossierNumber() + "]",
                    item.metalType() != null ? item.metalType() : "GOLD",
                    item.fineness() != null ? item.fineness() : "750‰",
                    item.grossWeightGrams(),
                    item.estimatedNetWeightGrams(),
                    "Poinçon à la tête d'aigle / mixte",
                    event.sellerFullName(),
                    event.sellerCniPassport(),
                    event.sellerAddress(),
                    item.totalPriceCents(),
                    event.occurredAt()
            );
            log.info("Lot de rachat '{}' inscrit au Livre de Police pour le vendeur {}",
                    item.description(), event.sellerFullName());
        }
    }
}
