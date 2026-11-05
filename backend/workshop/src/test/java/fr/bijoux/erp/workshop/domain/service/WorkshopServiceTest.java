package fr.bijoux.erp.workshop.domain.service;

import fr.bijoux.erp.workshop.domain.model.CustomManufacturingOrder;
import fr.bijoux.erp.workshop.domain.model.RepairOrder;
import fr.bijoux.erp.workshop.domain.model.WorkshopStatus;
import fr.bijoux.erp.workshop.domain.repository.CustomManufacturingOrderRepository;
import fr.bijoux.erp.workshop.domain.repository.RepairOrderRepository;
import fr.bijoux.erp.workshop.dto.CreateCustomOrderRequest;
import fr.bijoux.erp.workshop.dto.CreateRepairOrderRequest;
import fr.bijoux.erp.workshop.dto.RepairOrderResponse;
import fr.bijoux.erp.workshop.dto.WorkshopStatusUpdateRequest;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("Tests Unitaires - Atelier SAV & State Machine (Freinte 3-8%)")
class WorkshopServiceTest {

    @Mock
    private RepairOrderRepository repairOrderRepository;

    @Mock
    private CustomManufacturingOrderRepository customOrderRepository;

    private WorkshopService workshopService;

    @BeforeEach
    void setUp() {
        workshopService = new WorkshopService(repairOrderRepository, customOrderRepository);
    }

    @Test
    @DisplayName("Doit créer un bon de confié réparation en statut DEPOT avec schéma SVG des défauts")
    void shouldCreateRepairOrder() {
        when(repairOrderRepository.countByStoreId(1L)).thenReturn(0L);
        when(repairOrderRepository.save(any(RepairOrder.class))).thenAnswer(inv -> {
            RepairOrder r = inv.getArgument(0);
            r.setId(5L);
            return r;
        });

        CreateRepairOrderRequest request = new CreateRepairOrderRequest(
                1L,
                42L,
                "artisan_accueil",
                "Bague or jaune avec griffe cassée",
                "GOLD",
                "750‰",
                new BigDecimal("6.500"),
                "<svg><circle cx='10' cy='10' r='5' fill='red'/></svg>",
                15_000L,
                "Choc survenu lors d'un déménagement"
        );

        RepairOrderResponse response = workshopService.createRepairOrder(request);

        assertThat(response.orderNumber()).isEqualTo("REP-1-000001");
        assertThat(response.status()).isEqualTo(WorkshopStatus.DEPOT);
        assertThat(response.svgDefectDiagram()).contains("<svg>");
    }

    @Test
    @DisplayName("State Machine : Doit respecter les transitions autorisées et bloquer les sauts d'étapes illégaux")
    void shouldEnforceStateMachineTransitions() {
        RepairOrder order = new RepairOrder(
                "REP-1-001", 1L, 42L, "op1", "Bague", "GOLD", "750‰",
                new BigDecimal("5.000"), null, 10_000L
        );
        order.setId(10L);
        order.setStatus(WorkshopStatus.DEPOT);

        when(repairOrderRepository.findById(10L)).thenReturn(Optional.of(order));
        when(repairOrderRepository.save(any(RepairOrder.class))).thenAnswer(inv -> inv.getArgument(0));

        // 1. DEPOT -> DEVIS (Valide)
        RepairOrderResponse toDevis = workshopService.updateRepairStatus(10L, new WorkshopStatusUpdateRequest(WorkshopStatus.DEVIS, null, null, null));
        assertThat(toDevis.status()).isEqualTo(WorkshopStatus.DEVIS);

        // 2. Tentative de transition illégale : DEVIS -> RESTITUE sans passer par la réalisation, mais possible si devis refusé
        // Essayons une transition strictement impossible : DEVIS -> CONTROLE_QUALITE
        assertThatThrownBy(() -> workshopService.updateRepairStatus(10L, new WorkshopStatusUpdateRequest(WorkshopStatus.CONTROLE_QUALITE, null, null, null)))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("Transition d'état d'atelier invalide");

        // 3. DEVIS -> EN_COURS (Valide)
        order.setStatus(WorkshopStatus.DEVIS);
        workshopService.updateRepairStatus(10L, new WorkshopStatusUpdateRequest(WorkshopStatus.EN_COURS, "artisan_jean", null, null));
        assertThat(order.getStatus()).isEqualTo(WorkshopStatus.EN_COURS);
        assertThat(order.getAssignedArtisanUsername()).isEqualTo("artisan_jean");

        // 4. EN_COURS -> CONTROLE_QUALITE (Valide)
        workshopService.updateRepairStatus(10L, new WorkshopStatusUpdateRequest(WorkshopStatus.CONTROLE_QUALITE, null, null, null));
        assertThat(order.getStatus()).isEqualTo(WorkshopStatus.CONTROLE_QUALITE);

        // 5. CONTROLE_QUALITE -> PRET_RETRAIT (Valide)
        workshopService.updateRepairStatus(10L, new WorkshopStatusUpdateRequest(WorkshopStatus.PRET_RETRAIT, null, 12_000L, null));
        assertThat(order.getStatus()).isEqualTo(WorkshopStatus.PRET_RETRAIT);

        // 6. PRET_RETRAIT -> RESTITUE (Valide)
        workshopService.updateRepairStatus(10L, new WorkshopStatusUpdateRequest(WorkshopStatus.RESTITUE, null, null, null));
        assertThat(order.getStatus()).isEqualTo(WorkshopStatus.RESTITUE);
        assertThat(order.getActualDeliveryDate()).isNotNull();
    }

    @Test
    @DisplayName("Freinte Joaillière : Doit calculer la perte au feu dans la plage 3% à 8%")
    void shouldCalculateFireLossCorrectly() {
        // 20.000g d'or fin avec 5.00% de freinte standard -> 19.000g
        BigDecimal result = workshopService.calculateNetWeightAfterFireLoss(
                new BigDecimal("20.000"),
                new BigDecimal("5.00")
        );
        assertThat(result).isEqualByComparingTo(new BigDecimal("19.000"));

        // Freinte hors norme (< 3%) doit échouer
        assertThatThrownBy(() -> workshopService.calculateNetWeightAfterFireLoss(new BigDecimal("20.000"), new BigDecimal("2.50")))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("compris entre 3.00% et 8.00%");

        // Freinte hors norme (> 8%) doit échouer
        assertThatThrownBy(() -> workshopService.calculateNetWeightAfterFireLoss(new BigDecimal("20.000"), new BigDecimal("8.50")))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("compris entre 3.00% et 8.00%");
    }
}
