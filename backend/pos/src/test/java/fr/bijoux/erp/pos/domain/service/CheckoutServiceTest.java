package fr.bijoux.erp.pos.domain.service;

import fr.bijoux.erp.catalog.domain.model.VatRegime;
import fr.bijoux.erp.core.audit.service.FiscalSealingEngine;
import fr.bijoux.erp.core.event.SaleCompletedEvent;
import fr.bijoux.erp.pos.domain.factory.PosTicketFactory;
import fr.bijoux.erp.pos.domain.model.PaymentMethod;
import fr.bijoux.erp.pos.domain.model.PosItemType;
import fr.bijoux.erp.pos.domain.model.PosTicket;
import fr.bijoux.erp.pos.domain.repository.PosTicketRepository;
import fr.bijoux.erp.pos.domain.strategy.*;
import fr.bijoux.erp.pos.dto.CheckoutRepairRequest;
import fr.bijoux.erp.pos.dto.CheckoutRequest;
import fr.bijoux.erp.pos.dto.CheckoutResponse;
import fr.bijoux.erp.workshop.domain.service.WorkshopService;
import fr.bijoux.erp.workshop.dto.RepairInvoiceDto;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("Tests Unitaires - CheckoutService et Encaissements NF525")
class CheckoutServiceTest {

    @Mock
    private PosTicketRepository ticketRepository;

    @Mock
    private ApplicationEventPublisher eventPublisher;

    @Mock
    private WorkshopService workshopService;

    private CheckoutService checkoutService;

    @BeforeEach
    void setUp() {
        VatCalculationService vatCalculationService = new VatCalculationService();
        PosTicketFactory ticketFactory = new PosTicketFactory(vatCalculationService);

        List<PaymentStrategy> strategies = List.of(
                new CashPaymentStrategy(),
                new CardPaymentStrategy(),
                new VoucherPaymentStrategy(),
                new GoldScrapPaymentStrategy()
        );
        PaymentStrategyRegistry registry = new PaymentStrategyRegistry(strategies);
        FiscalSealingEngine sealingEngine = new FiscalSealingEngine();

        checkoutService = new CheckoutService(
                ticketRepository,
                ticketFactory,
                registry,
                vatCalculationService,
                sealingEngine,
                eventPublisher,
                workshopService
        );
        ReflectionTestUtils.setField(checkoutService, "sealingSecret", "TEST_FISCAL_KEY_FOR_UNIT_TESTS_128_BITS");
    }

    @Test
    @DisplayName("Doit valider un encaissement espèces valide et calculer le rendu de monnaie")
    void shouldProcessCashCheckoutSuccessfully() {
        when(ticketRepository.countByStoreId(1L)).thenReturn(0L);
        when(ticketRepository.findTopByStoreIdOrderByCreatedAtDescIdDesc(1L)).thenReturn(Optional.empty());
        when(ticketRepository.save(any(PosTicket.class))).thenAnswer(invocation -> invocation.getArgument(0));

        // Panier de 250,00 € TTC, payé avec 300,00 € en espèces -> Rendu 50,00 €
        CheckoutRequest.CartLineDto line = new CheckoutRequest.CartLineDto(
                1, PosItemType.CATALOG_ITEM, 10L, "Bague Or Blanc 750", 1, 25_000L, VatRegime.STANDARD_20, 10_000L, false
        );
        CheckoutRequest.PaymentDto payment = new CheckoutRequest.PaymentDto(
                PaymentMethod.CASH, 25_000L, 30_000L, null, null, null
        );
        CheckoutRequest request = new CheckoutRequest(1L, "vendeur1", 42L, List.of(line), List.of(payment));

        CheckoutResponse response = checkoutService.processCheckout(request);

        assertThat(response).isNotNull();
        assertThat(response.ticketNumber()).isEqualTo("TKT-1-000001");
        assertThat(response.totalTtcCents()).isEqualTo(25_000L);
        assertThat(response.totalChangeGivenCents()).isEqualTo(5_000L); // 50,00 € rendu
        assertThat(response.signature()).isNotBlank();

        verify(eventPublisher, times(1)).publishEvent(any(SaleCompletedEvent.class));
    }

    @Test
    @DisplayName("Doit interdire strictement un paiement en espèces supérieur à 1 000 € (Art. L112-6 CMF)")
    void shouldRejectCashPaymentOver1000Euros() {
        // Panier de 1 200,00 € en espèces
        CheckoutRequest.CartLineDto line = new CheckoutRequest.CartLineDto(
                1, PosItemType.CATALOG_ITEM, 10L, "Collier Diamant Solitaire", 1, 120_000L, VatRegime.STANDARD_20, 50_000L, false
        );
        CheckoutRequest.PaymentDto payment = new CheckoutRequest.PaymentDto(
                PaymentMethod.CASH, 120_000L, 120_000L, null, null, null
        );
        CheckoutRequest request = new CheckoutRequest(1L, "vendeur1", 42L, List.of(line), List.of(payment));

        assertThatThrownBy(() -> checkoutService.processCheckout(request))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("supérieur au plafond légal strict de 1 000 € interdit");

        verify(ticketRepository, never()).save(any());
        verify(eventPublisher, never()).publishEvent(any());
    }

    @Test
    @DisplayName("Doit valider un paiement multi-moyens (mixte CB + Avoir/Voucher)")
    void shouldProcessMultiPaymentCheckout() {
        when(ticketRepository.countByStoreId(1L)).thenReturn(4L);
        when(ticketRepository.findTopByStoreIdOrderByCreatedAtDescIdDesc(1L)).thenReturn(Optional.empty());
        when(ticketRepository.save(any(PosTicket.class))).thenAnswer(invocation -> invocation.getArgument(0));

        // Panier de 500,00 € TTC : 100 € par Avoir + 400 € par CB
        CheckoutRequest.CartLineDto line = new CheckoutRequest.CartLineDto(
                1, PosItemType.CATALOG_ITEM, 10L, "Bracelet Tennis Diamants", 1, 50_000L, VatRegime.STANDARD_20, 20_000L, false
        );
        CheckoutRequest.PaymentDto p1 = new CheckoutRequest.PaymentDto(
                PaymentMethod.VOUCHER, 10_000L, null, null, "AVOIR-2026-001", null
        );
        CheckoutRequest.PaymentDto p2 = new CheckoutRequest.PaymentDto(
                PaymentMethod.CARD, 40_000L, null, "TPE-TOKEN-XYZ123", null, null
        );
        CheckoutRequest request = new CheckoutRequest(1L, "vendeur1", 42L, List.of(line), List.of(p1, p2));

        CheckoutResponse response = checkoutService.processCheckout(request);

        assertThat(response.totalTtcCents()).isEqualTo(50_000L);
        assertThat(response.payments()).hasSize(2);
        assertThat(response.payments().get(0).paymentMethod()).isEqualTo("VOUCHER");
        assertThat(response.payments().get(1).paymentMethod()).isEqualTo("CARD");
    }

    @Test
    @DisplayName("SAV : Doit encaisser une réparation en déduisant l'acompte et clôturer la fiche en LIVRE_ET_FACTURE")
    void shouldCheckoutRepairWithDepositDeducted() {
        when(ticketRepository.countByStoreId(1L)).thenReturn(10L);
        when(ticketRepository.findTopByStoreIdOrderByCreatedAtDescIdDesc(1L)).thenReturn(Optional.empty());
        when(ticketRepository.save(any(PosTicket.class))).thenAnswer(inv -> inv.getArgument(0));

        // Devis total : 150€ (15 000c), Acompte déjà versé : 50€ (5 000c) -> Solde dû : 100€ (10 000c)
        RepairInvoiceDto invoice = new RepairInvoiceDto(
                99L,
                "REP-1-000099",
                1L,
                42L,
                "Remplacement chaton or gris",
                "OR_GRIS",
                "750‰",
                new java.math.BigDecimal("3.800"),
                15_000L,
                5_000L,
                10_000L,
                new RepairInvoiceDto.LaborDetailDto("Façon", 10_000L),
                List.of(),
                "PRET_RETRAIT",
                java.time.Instant.now()
        );

        when(workshopService.prepareRepairInvoice(99L)).thenReturn(invoice);

        // Client règle le solde de 100€ par Carte Bancaire
        CheckoutRepairRequest request = new CheckoutRepairRequest(
                99L,
                1L,
                "vendeur1",
                42L,
                List.of(new CheckoutRequest.PaymentDto(PaymentMethod.CARD, 10_000L, null, "TPE-OK-123", null, null))
        );

        CheckoutResponse response = checkoutService.checkoutRepair(request);

        assertThat(response.totalTtcCents()).isEqualTo(10_000L);
        assertThat(response.ticketNumber()).isEqualTo("TKT-1-000011");
        assertThat(response.signature()).isNotBlank();

        // Vérification de l'appel pour clôturer l'ordre de réparation
        verify(workshopService).markDeliveredAndInvoiced(99L);
    }
}
