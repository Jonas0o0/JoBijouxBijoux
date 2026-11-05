package fr.bijoux.erp.gold.domain.service;

import fr.bijoux.erp.core.event.GoldRepurchasedEvent;
import fr.bijoux.erp.gold.domain.model.*;
import fr.bijoux.erp.gold.domain.repository.GoldRepurchaseDossierRepository;
import fr.bijoux.erp.gold.domain.strategy.GoldTaxStrategyRegistry;
import fr.bijoux.erp.gold.domain.strategy.TmpStrategy;
import fr.bijoux.erp.gold.domain.strategy.TpvStrategy;
import fr.bijoux.erp.gold.dto.CreateGoldDossierRequest;
import fr.bijoux.erp.gold.dto.GoldDossierResponse;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.context.ApplicationEventPublisher;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("Tests Unitaires - Service Rachat d'Or (Règle 0€ Espèces & Séquestre 48h)")
class GoldRepurchaseServiceTest {

    @Mock
    private GoldRepurchaseDossierRepository dossierRepository;

    @Mock
    private ApplicationEventPublisher eventPublisher;

    private GoldRepurchaseService repurchaseService;

    @BeforeEach
    void setUp() {
        GoldTaxStrategyRegistry registry = new GoldTaxStrategyRegistry(List.of(new TmpStrategy(), new TpvStrategy()));
        repurchaseService = new GoldRepurchaseService(dossierRepository, registry, eventPublisher);
    }

    @Test
    @DisplayName("Doit créer un dossier de rachat d'or avec calcul TMP 11.5% et paiement par Virement")
    void shouldCreateGoldDossierWithTmp() {
        when(dossierRepository.countByStoreId(1L)).thenReturn(0L);
        when(dossierRepository.save(any(GoldRepurchaseDossier.class))).thenAnswer(inv -> {
            GoldRepurchaseDossier d = inv.getArgument(0);
            d.setId(10L);
            return d;
        });

        // Lot d'or 18 carats (750‰) de 10 grammes à 50 €/g net = 500,00 € (50 000 cents)
        CreateGoldDossierRequest.GoldScrapItemDto item = new CreateGoldDossierRequest.GoldScrapItemDto(
                "Débris bagues or 18k",
                "GOLD",
                "750‰",
                new BigDecimal("10.000"),
                new BigDecimal("10.000"),
                new BigDecimal("0.7500"),
                5_000L // 50,00 € / g
        );

        CreateGoldDossierRequest request = new CreateGoldDossierRequest(
                1L,
                "gemmologue1",
                null,
                "Marc Lambert",
                "CNI-FR-11223344",
                "25 boulevard Haussmann, Paris",
                GoldTaxRegime.TMP_11_5,
                GoldPaymentMethod.VIREMENT,
                null,
                null,
                List.of(item)
        );

        GoldDossierResponse response = repurchaseService.createDossier(request);

        assertThat(response).isNotNull();
        assertThat(response.dossierNumber()).isEqualTo("DOS-GOLD-1-000001");
        assertThat(response.totalGrossAmountCents()).isEqualTo(50_000L); // 500,00 €
        assertThat(response.taxAmountCents()).isEqualTo(5_750L); // 57,50 € (11.5% TMP)
        assertThat(response.netPayableToSellerCents()).isEqualTo(44_250L); // 442,50 €
        assertThat(response.paymentMethod()).isEqualTo(GoldPaymentMethod.VIREMENT);
    }

    @Test
    @DisplayName("Doit enclencher la période de rétractation de 48h lors de la signature (Art. L224-96 C. Conso)")
    void shouldStart48HourCoolingOffOnSign() {
        GoldRepurchaseDossier dossier = new GoldRepurchaseDossier(
                "DOS-GOLD-1-001", 1L, "gem1", null, "Marc Lambert", "CNI-123",
                GoldTaxRegime.TMP_11_5, GoldPaymentMethod.CHEQUE
        );
        dossier.setId(10L);
        dossier.setStatus(GoldRepurchaseStatus.ESTIMATED);

        when(dossierRepository.findById(10L)).thenReturn(Optional.of(dossier));
        when(dossierRepository.save(any(GoldRepurchaseDossier.class))).thenAnswer(inv -> inv.getArgument(0));

        GoldDossierResponse signed = repurchaseService.signDossier(10L, GoldPaymentMethod.CHEQUE);

        assertThat(signed.status()).isEqualTo(GoldRepurchaseStatus.QUARANTINE_48H);
        assertThat(signed.signedAt()).isNotNull();
        assertThat(signed.coolingOffEndsAt()).isAfter(signed.signedAt());
        assertThat(ChronoUnit.HOURS.between(signed.signedAt(), signed.coolingOffEndsAt())).isEqualTo(48L);
    }

    @Test
    @DisplayName("Doit interdire la finalisation avant la fin des 48h de rétractation")
    void shouldBlockFinalizationBefore48Hours() {
        GoldRepurchaseDossier dossier = new GoldRepurchaseDossier(
                "DOS-GOLD-1-001", 1L, "gem1", null, "Marc Lambert", "CNI-123",
                GoldTaxRegime.TMP_11_5, GoldPaymentMethod.VIREMENT
        );
        dossier.setId(10L);
        dossier.setStatus(GoldRepurchaseStatus.QUARANTINE_48H);
        dossier.setSignedAt(Instant.now());
        dossier.setCoolingOffEndsAt(Instant.now().plus(48, ChronoUnit.HOURS));

        when(dossierRepository.findById(10L)).thenReturn(Optional.of(dossier));

        assertThatThrownBy(() -> repurchaseService.finalizeDossier(10L, false))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("Le délai légal de rétractation de 48h");
    }

    @Test
    @DisplayName("Doit finaliser après expiration des 48h et publier l'événement GoldRepurchasedEvent")
    void shouldFinalizeDossierAndPublishEvent() {
        GoldRepurchaseDossier dossier = new GoldRepurchaseDossier(
                "DOS-GOLD-1-001", 1L, "gem1", null, "Marc Lambert", "CNI-123",
                GoldTaxRegime.TMP_11_5, GoldPaymentMethod.VIREMENT
        );
        dossier.setId(10L);
        dossier.setStatus(GoldRepurchaseStatus.QUARANTINE_48H);
        dossier.setSignedAt(Instant.now().minus(50, ChronoUnit.HOURS));
        dossier.setCoolingOffEndsAt(Instant.now().minus(2, ChronoUnit.HOURS)); // Dépassé de 2h

        when(dossierRepository.findById(10L)).thenReturn(Optional.of(dossier));
        when(dossierRepository.save(any(GoldRepurchaseDossier.class))).thenAnswer(inv -> inv.getArgument(0));

        GoldDossierResponse finalized = repurchaseService.finalizeDossier(10L, false);

        assertThat(finalized.status()).isEqualTo(GoldRepurchaseStatus.FINALIZED);
        assertThat(finalized.finalizedAt()).isNotNull();

        verify(eventPublisher, times(1)).publishEvent(any(GoldRepurchasedEvent.class));
    }
}
