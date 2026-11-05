package fr.bijoux.erp.weightaccount.event;

import fr.bijoux.erp.core.event.GoldRepurchasedEvent;
import fr.bijoux.erp.weightaccount.domain.model.WeightMovementType;
import fr.bijoux.erp.weightaccount.domain.service.WeightAccountService;
import fr.bijoux.erp.weightaccount.dto.WeightMovementRequest;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.modulith.events.ApplicationModuleListener;
import org.springframework.stereotype.Component;

/**
 * Listener Spring Modulith observant les rachats d'or finalisés
 * pour créditer automatiquement le compte-poids d'or fin du magasin.
 */
@Component
public class WeightAccountEventListener {

    private static final Logger log = LoggerFactory.getLogger(WeightAccountEventListener.class);
    private final WeightAccountService weightAccountService;

    public WeightAccountEventListener(WeightAccountService weightAccountService) {
        this.weightAccountService = weightAccountService;
    }

    @ApplicationModuleListener
    public void onGoldRepurchased(GoldRepurchasedEvent event) {
        log.info("Crédit du compte-poids or fin suite à rachat validé pour dossier {}", event.dossierNumber());

        WeightMovementRequest request = new WeightMovementRequest(
                event.storeId(),
                "STOCK_OR_FIN_MAGASIN",
                "STOCK_INTERNE",
                "GOLD",
                WeightMovementType.CREDIT_FINE_GOLD,
                event.totalEstimatedNetWeightGrams(),
                event.dossierNumber(),
                "Entrée or fin suite au rachat d'or validé dossier " + event.dossierNumber()
        );

        weightAccountService.recordMovement(request);
        log.info("Compte-poids or fin crédité de {}g pour le magasin {}",
                event.totalEstimatedNetWeightGrams(), event.storeId());
    }
}
