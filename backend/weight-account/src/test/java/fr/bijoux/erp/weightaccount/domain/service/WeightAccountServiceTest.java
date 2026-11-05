package fr.bijoux.erp.weightaccount.domain.service;

import fr.bijoux.erp.core.event.GoldRepurchasedEvent;
import fr.bijoux.erp.weightaccount.domain.model.GoldFixingRate;
import fr.bijoux.erp.weightaccount.domain.model.WeightAccountLedger;
import fr.bijoux.erp.weightaccount.domain.model.WeightMovementType;
import fr.bijoux.erp.weightaccount.domain.repository.GoldFixingRateRepository;
import fr.bijoux.erp.weightaccount.domain.repository.WeightAccountLedgerRepository;
import fr.bijoux.erp.weightaccount.dto.GoldFixingDto;
import fr.bijoux.erp.weightaccount.dto.RecordFixingRequest;
import fr.bijoux.erp.weightaccount.dto.WeightAccountBalanceDto;
import fr.bijoux.erp.weightaccount.dto.WeightMovementRequest;
import fr.bijoux.erp.weightaccount.event.WeightAccountEventListener;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("Tests Unitaires - Comptes-Poids Or Fin & Cours du Métal")
class WeightAccountServiceTest {

    @Mock
    private WeightAccountLedgerRepository ledgerRepository;

    @Mock
    private GoldFixingRateRepository fixingRepository;

    private WeightAccountService weightAccountService;

    @BeforeEach
    void setUp() {
        weightAccountService = new WeightAccountService(ledgerRepository, fixingRepository);
    }

    @Test
    @DisplayName("Doit créditer le compte-poids et calculer le nouveau solde cumulatif")
    void shouldCreditWeightAccount() {
        // Solde précédent : 50.000g chez Cookson
        WeightAccountLedger previous = new WeightAccountLedger(
                1L, "Cookson-CLAL", "AFFINEUR", "GOLD",
                WeightMovementType.CREDIT_FINE_GOLD, new BigDecimal("50.000"),
                new BigDecimal("50.000"), "DOC-INITIAL", "Solde initial"
        );

        when(ledgerRepository.findTopByStoreIdAndPartnerNameAndMetalTypeOrderByTimestampDescIdDesc(1L, "Cookson-CLAL", "GOLD"))
                .thenReturn(Optional.of(previous));
        when(ledgerRepository.save(any(WeightAccountLedger.class))).thenAnswer(inv -> inv.getArgument(0));

        // Dépôt de 25.500g d'or fin
        WeightMovementRequest request = new WeightMovementRequest(
                1L, "Cookson-CLAL", "AFFINEUR", "GOLD",
                WeightMovementType.CREDIT_FINE_GOLD, new BigDecimal("25.500"),
                "BON-DEPOT-123", "Envoi grenaille or fin"
        );

        WeightAccountLedger entry = weightAccountService.recordMovement(request);

        assertThat(entry.getBalanceAfterGrams()).isEqualByComparingTo(new BigDecimal("75.500")); // 50 + 25.5
        verify(ledgerRepository, times(1)).save(any(WeightAccountLedger.class));
    }

    @Test
    @DisplayName("Doit débiter le compte-poids lors d'une utilisation d'or fin")
    void shouldDebitWeightAccount() {
        WeightAccountLedger previous = new WeightAccountLedger(
                1L, "Saamp", "AFFINEUR", "GOLD",
                WeightMovementType.CREDIT_FINE_GOLD, new BigDecimal("100.000"),
                new BigDecimal("100.000"), "INIT", "Solde"
        );

        when(ledgerRepository.findTopByStoreIdAndPartnerNameAndMetalTypeOrderByTimestampDescIdDesc(1L, "Saamp", "GOLD"))
                .thenReturn(Optional.of(previous));
        when(ledgerRepository.save(any(WeightAccountLedger.class))).thenAnswer(inv -> inv.getArgument(0));

        // Retrait de 30.000g d'or fin pour fonte atelier
        WeightMovementRequest request = new WeightMovementRequest(
                1L, "Saamp", "AFFINEUR", "GOLD",
                WeightMovementType.DEBIT_FINE_GOLD, new BigDecimal("30.000"),
                "CUST-1-000001", "Fonte bague création"
        );

        WeightAccountLedger entry = weightAccountService.recordMovement(request);

        assertThat(entry.getBalanceAfterGrams()).isEqualByComparingTo(new BigDecimal("70.000")); // 100 - 30
    }

    @Test
    @DisplayName("Doit enregistrer et restituer le cours spot de l'or")
    void shouldRecordAndGetGoldFixing() {
        when(fixingRepository.save(any(GoldFixingRate.class))).thenAnswer(inv -> inv.getArgument(0));
        when(fixingRepository.findTopByMetalTypeOrderByFixingTimestampDesc("GOLD"))
                .thenReturn(Optional.of(new GoldFixingRate("GOLD", "EUR", 7550L, "LBMA PM")));

        RecordFixingRequest req = new RecordFixingRequest("GOLD", "EUR", 7550L, "LBMA PM");
        GoldFixingDto recorded = weightAccountService.recordFixing(req);

        assertThat(recorded.spotPricePerGramCents()).isEqualTo(7550L);

        GoldFixingDto latest = weightAccountService.getLatestFixing("GOLD");
        assertThat(latest.spotPricePerGramFormatted()).isEqualTo("75.50 EUR/g");
    }

    @Test
    @DisplayName("L'écouteur GoldRepurchasedEvent doit créditer automatiquement le compte-poids")
    void shouldCreditAccountOnGoldRepurchasedEvent() {
        when(ledgerRepository.findTopByStoreIdAndPartnerNameAndMetalTypeOrderByTimestampDescIdDesc(any(), any(), any()))
                .thenReturn(Optional.empty());
        when(ledgerRepository.save(any(WeightAccountLedger.class))).thenAnswer(inv -> inv.getArgument(0));

        WeightAccountEventListener listener = new WeightAccountEventListener(weightAccountService);

        GoldRepurchasedEvent event = new GoldRepurchasedEvent(
                10L, "DOS-GOLD-1-000010", 1L, "op1", 5L, "Vendeur Test", "CNI-888",
                "Paris", new BigDecimal("12.000"), new BigDecimal("9.000"), 45_000L,
                List.of(), Instant.now().plusSeconds(172800), Instant.now()
        );

        listener.onGoldRepurchased(event);

        verify(ledgerRepository, times(1)).save(any(WeightAccountLedger.class));
    }
}
