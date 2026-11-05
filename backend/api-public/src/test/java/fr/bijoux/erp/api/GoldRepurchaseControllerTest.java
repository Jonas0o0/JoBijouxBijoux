package fr.bijoux.erp.api;

import com.fasterxml.jackson.databind.ObjectMapper;
import fr.bijoux.erp.gold.domain.model.GoldPaymentMethod;
import fr.bijoux.erp.gold.domain.model.GoldRepurchaseStatus;
import fr.bijoux.erp.gold.domain.model.GoldTaxRegime;
import fr.bijoux.erp.gold.domain.service.GoldRepurchaseService;
import fr.bijoux.erp.gold.dto.CreateGoldDossierRequest;
import fr.bijoux.erp.gold.dto.GoldDossierResponse;
import fr.bijoux.erp.gold.dto.GoldEstimateRequest;
import fr.bijoux.erp.gold.dto.GoldEstimateResponse;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(GoldRepurchaseController.class)
@AutoConfigureMockMvc(addFilters = false)
@DisplayName("Tests du contrôleur REST Rachat d'Or (GoldRepurchaseController)")
class GoldRepurchaseControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private GoldRepurchaseService goldService;

    @MockBean
    private fr.bijoux.erp.core.security.jwt.JwtTokenProvider jwtTokenProvider;

    @Test
    @DisplayName("POST /api/v1/gold/estimate - Doit calculer l'estimation avec taxe TMP 11.5%")
    void shouldEstimateGold() throws Exception {
        CreateGoldDossierRequest.GoldScrapItemDto item = new CreateGoldDossierRequest.GoldScrapItemDto(
                "Bague débris",
                "OR",
                "750",
                new BigDecimal("10.00"),
                new BigDecimal("10.00"),
                new BigDecimal("0.750"),
                5250L
        );
        GoldEstimateRequest request = new GoldEstimateRequest(
                GoldTaxRegime.TMP_11_5,
                null,
                null,
                false,
                List.of(item)
        );

        GoldEstimateResponse response = new GoldEstimateResponse(
                new BigDecimal("10.00"),
                new BigDecimal("7.500"),
                52500L,
                6038L,
                46462L,
                "TMP_11_5",
                "Taxe Métaux Précieux forfaitaire de 11.5%"
        );

        when(goldService.estimate(any(GoldEstimateRequest.class))).thenReturn(response);

        mockMvc.perform(post("/api/v1/gold/estimate")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.netPayableCents").value(46462))
                .andExpect(jsonPath("$.taxAmountCents").value(6038))
                .andExpect(jsonPath("$.taxStrategy").value("TMP_11_5"));
    }

    @Test
    @DisplayName("POST /api/v1/gold/dossiers/{id}/sign - Doit signer le dossier de rachat")
    void shouldSignDossier() throws Exception {
        GoldDossierResponse response = new GoldDossierResponse(
                1L,
                "OR-20261105-0001",
                1L,
                "OP_ADMIN",
                10L,
                "Alice Dupont",
                "CNI-987654321",
                GoldRepurchaseStatus.SIGNED,
                GoldPaymentMethod.VIREMENT,
                new BigDecimal("10.00"),
                new BigDecimal("7.500"),
                52500L,
                GoldTaxRegime.TMP_11_5,
                6038L,
                46462L,
                Instant.now(),
                Instant.now().plusSeconds(172800),
                null,
                Instant.now(),
                List.of()
        );

        when(goldService.signDossier(eq(1L), eq(GoldPaymentMethod.VIREMENT))).thenReturn(response);

        mockMvc.perform(post("/api/v1/gold/dossiers/1/sign")
                        .param("method", "VIREMENT"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("SIGNED"))
                .andExpect(jsonPath("$.paymentMethod").value("VIREMENT"));
    }
}
