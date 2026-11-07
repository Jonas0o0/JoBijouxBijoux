package fr.bijoux.erp.api;

import com.fasterxml.jackson.databind.ObjectMapper;
import fr.bijoux.erp.catalog.domain.model.VatRegime;
import fr.bijoux.erp.pos.domain.model.FiscalClosure;
import fr.bijoux.erp.pos.domain.model.FiscalClosureType;
import fr.bijoux.erp.pos.domain.model.PaymentMethod;
import fr.bijoux.erp.pos.domain.model.PosItemType;
import fr.bijoux.erp.pos.domain.model.PosTicketStatus;
import fr.bijoux.erp.pos.domain.service.CheckoutService;
import fr.bijoux.erp.pos.domain.service.FiscalClosureService;
import fr.bijoux.erp.pos.dto.CartValidationResult;
import fr.bijoux.erp.pos.dto.CheckoutRepairRequest;
import fr.bijoux.erp.pos.dto.CheckoutRequest;
import fr.bijoux.erp.pos.dto.CheckoutResponse;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

import java.time.Instant;
import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(PosController.class)
@AutoConfigureMockMvc(addFilters = false)
@WithMockUser(username = "admin", roles = {"ADMIN", "GERANT"})
@DisplayName("Tests du contrôleur REST POS (Point de Vente & Caisse)")
class PosControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private CheckoutService checkoutService;

    @MockBean
    private FiscalClosureService closureService;

    @MockBean
    private fr.bijoux.erp.core.security.jwt.JwtTokenProvider jwtTokenProvider;

    @Test
    @DisplayName("POST /api/v1/pos/checkout - Doit encaisser avec succès")
    void shouldProcessCheckout() throws Exception {
        CheckoutRequest.CartLineDto item = new CheckoutRequest.CartLineDto(
                1,
                PosItemType.CATALOG_ITEM,
                100L,
                "Solitaire Diamant 0.5ct",
                1,
                150000L,
                VatRegime.STANDARD_20,
                null,
                false
        );
        CheckoutRequest.PaymentDto payment = new CheckoutRequest.PaymentDto(
                PaymentMethod.CARD,
                150000L,
                null,
                "TPE-TX-998877",
                null,
                null
        );
        CheckoutRequest request = new CheckoutRequest(
                1L,
                "JEAN_VENDEUR",
                10L,
                List.of(item),
                List.of(payment)
        );

        CheckoutResponse response = new CheckoutResponse(
                1L,
                "TK-20261105-0001",
                1L,
                150000L,
                125000L,
                25000L,
                0L,
                PosTicketStatus.COMPLETED,
                "HMAC_TEST_HASH_12345",
                Instant.now(),
                List.of(new CheckoutResponse.PaymentSummaryDto("CARD", 150000L, "TPE-TX-998877", "ACCEPTED"))
        );

        when(checkoutService.processCheckout(any(CheckoutRequest.class))).thenReturn(response);

        mockMvc.perform(post("/api/v1/pos/checkout")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.ticketNumber").value("TK-20261105-0001"))
                .andExpect(jsonPath("$.totalTtcCents").value(150000))
                .andExpect(jsonPath("$.signature").value("HMAC_TEST_HASH_12345"));
    }

    @Test
    @DisplayName("POST /api/v1/pos/cart/validate - Doit ventiler la TVA")
    void shouldValidateCart() throws Exception {
        CheckoutRequest.CartLineDto item = new CheckoutRequest.CartLineDto(
                1,
                PosItemType.CATALOG_ITEM,
                101L,
                "Bague Or 750",
                1,
                60000L,
                VatRegime.STANDARD_20,
                null,
                false
        );

        CartValidationResult validationResult = CartValidationResult.ok(60000L, 50000L, 10000L);

        when(checkoutService.validateCart(any())).thenReturn(validationResult);

        mockMvc.perform(post("/api/v1/pos/cart/validate")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(List.of(item))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.valid").value(true))
                .andExpect(jsonPath("$.totalTtcCents").value(60000))
                .andExpect(jsonPath("$.totalVatCents").value(10000));
    }

    @Test
    @DisplayName("POST /api/v1/pos/closures/z - Doit exécuter le Z journalier")
    void shouldExecuteDailyZ() throws Exception {
        FiscalClosure closure = new FiscalClosure(
                FiscalClosureType.JOURNALIER_Z,
                1L,
                1L,
                "OP-01",
                Instant.now().minusSeconds(28800),
                Instant.now(),
                500000L,
                416667L,
                83333L,
                "{}",
                "{}",
                5000000L,
                "CHAIN_HASH_PREV_123",
                "CHAIN_HASH_CURR_456",
                "HMAC_SIGNATURE_789"
        );
        closure.setId(1L);

        when(closureService.executeDailyZ(eq(1L), eq("OP-01"))).thenReturn(closure);

        mockMvc.perform(post("/api/v1/pos/closures/z")
                        .param("storeId", "1")
                        .param("operator", "OP-01"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.closureType").value("JOURNALIER_Z"))
                .andExpect(jsonPath("$.totalTtcCents").value(500000))
                .andExpect(jsonPath("$.grandTotalCumulativeCents").value(5000000));
    }

    @Test
    @DisplayName("GET /api/v1/pos/closures/x - Doit exécuter le X intérimaire")
    void shouldExecuteInterimX() throws Exception {
        FiscalClosure closure = new FiscalClosure(
                FiscalClosureType.INTERIM_X,
                0L,
                1L,
                "OP-01",
                Instant.now().minusSeconds(14400),
                Instant.now(),
                250000L,
                208333L,
                41667L,
                "{}",
                "{}",
                4750000L,
                "TRANSIENT",
                "CHAIN_HASH_X",
                "HMAC_SIGNATURE_X"
        );
        closure.setId(0L);

        when(closureService.executeInterimX(eq(1L), eq("OP-01"))).thenReturn(closure);

        mockMvc.perform(get("/api/v1/pos/closures/x")
                        .param("storeId", "1")
                        .param("operator", "OP-01"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.closureType").value("INTERIM_X"))
                .andExpect(jsonPath("$.totalTtcCents").value(250000));
    }

    @Test
    @DisplayName("POST /api/v1/pos/checkout/repair - Doit encaisser une réparation SAV avec déduction acompte")
    void shouldCheckoutRepair() throws Exception {
        CheckoutRepairRequest request = new CheckoutRepairRequest(
                12L,
                1L,
                "vendeur1",
                42L,
                List.of(new CheckoutRequest.PaymentDto(PaymentMethod.CARD, 8_000L, null, "TPE-123", null, null))
        );

        CheckoutResponse response = new CheckoutResponse(
                101L,
                "TKT-1-000101",
                1L,
                8_000L,
                6_667L,
                1_333L,
                0L,
                PosTicketStatus.COMPLETED,
                "SEALED_HASH_SIGNATURE",
                Instant.now(),
                List.of(new CheckoutResponse.PaymentSummaryDto("CARD", 8_000L, "TX_1", "APPROVED"))
        );

        when(checkoutService.checkoutRepair(any(CheckoutRepairRequest.class))).thenReturn(response);

        mockMvc.perform(post("/api/v1/pos/checkout/repair")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.ticketNumber").value("TKT-1-000101"))
                .andExpect(jsonPath("$.totalTtcCents").value(8000))
                .andExpect(jsonPath("$.status").value("COMPLETED"));
    }

    @Test
    @DisplayName("POST /api/v1/pos/cash-float - Doit enregistrer le fond de caisse initial")
    void shouldRecordCashFloat() throws Exception {
        PosController.CashFloatRequest request = new PosController.CashFloatRequest(
                1L,
                "CAISSE-01",
                30000L,
                "vendeuse1",
                "Ouverture matin 300 euros"
        );

        mockMvc.perform(post("/api/v1/pos/cash-float")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("RECORDED"))
                .andExpect(jsonPath("$.amountCents").value(30000));
    }

    @Test
    @DisplayName("POST /api/v1/pos/closures/m - Doit exécuter la clôture mensuelle M")
    void shouldExecuteMonthlyM() throws Exception {
        FiscalClosure closure = new FiscalClosure(
                FiscalClosureType.MENSUEL_M,
                1L,
                1L,
                "gerant",
                Instant.now().minusSeconds(86400 * 30),
                Instant.now(),
                15000000L,
                12500000L,
                2500000L,
                "{}",
                "{}",
                15000000L,
                "PREV_HASH",
                "CURR_HASH",
                "SEALED_HASH_MONTHLY"
        );
        closure.setId(10L);

        when(closureService.executeMonthlyM(1L, "gerant")).thenReturn(closure);

        mockMvc.perform(post("/api/v1/pos/closures/m")
                        .param("storeId", "1")
                        .param("operator", "gerant"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.closureType").value("MENSUEL_M"))
                .andExpect(jsonPath("$.totalTtcCents").value(15000000));
    }
}
