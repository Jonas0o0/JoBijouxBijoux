package fr.bijoux.erp.api;

import com.fasterxml.jackson.databind.ObjectMapper;
import fr.bijoux.erp.weightaccount.domain.service.WeightAccountService;
import fr.bijoux.erp.weightaccount.dto.GoldFixingDto;
import fr.bijoux.erp.weightaccount.dto.RecordFixingRequest;
import fr.bijoux.erp.weightaccount.dto.WeightAccountBalanceDto;
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

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(WeightAccountController.class)
@AutoConfigureMockMvc(addFilters = false)
@DisplayName("Tests du contrôleur REST Compte-Poids Métaux Précieux (WeightAccountController)")
class WeightAccountControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private WeightAccountService weightAccountService;

    @MockBean
    private fr.bijoux.erp.core.security.jwt.JwtTokenProvider jwtTokenProvider;

    @Test
    @DisplayName("GET /api/v1/weight-account/balance - Doit retourner le solde or fin d'un fondeur")
    void shouldGetWeightBalance() throws Exception {
        WeightAccountBalanceDto balanceDto = new WeightAccountBalanceDto(
                1L,
                "FONDEUR_COOKSON",
                "FONDEUR",
                "GOLD",
                new BigDecimal("350.250"),
                Instant.now()
        );

        when(weightAccountService.getCurrentBalance(eq(1L), eq("FONDEUR_COOKSON"), eq("GOLD")))
                .thenReturn(balanceDto);

        mockMvc.perform(get("/api/v1/weight-account/balance")
                        .param("storeId", "1")
                        .param("partnerName", "FONDEUR_COOKSON")
                        .param("metalType", "GOLD"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.partnerName").value("FONDEUR_COOKSON"))
                .andExpect(jsonPath("$.balanceGrams").value(350.250))
                .andExpect(jsonPath("$.metalType").value("GOLD"));
    }

    @Test
    @DisplayName("POST /api/v1/weight-account/fixing - Doit enregistrer un cours spot LBMA / CPoR")
    void shouldRecordFixing() throws Exception {
        RecordFixingRequest request = new RecordFixingRequest(
                "GOLD",
                "EUR",
                7650L,
                "CPOR_DEVISE"
        );

        GoldFixingDto fixingDto = new GoldFixingDto(
                "GOLD",
                "EUR",
                7650L,
                "76.50 EUR/g",
                Instant.now(),
                "CPOR_DEVISE"
        );

        when(weightAccountService.recordFixing(any(RecordFixingRequest.class))).thenReturn(fixingDto);

        mockMvc.perform(post("/api/v1/weight-account/fixing")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.spotPricePerGramCents").value(7650))
                .andExpect(jsonPath("$.spotPricePerGramFormatted").value("76.50 EUR/g"))
                .andExpect(jsonPath("$.currency").value("EUR"))
                .andExpect(jsonPath("$.source").value("CPOR_DEVISE"));
    }
}
