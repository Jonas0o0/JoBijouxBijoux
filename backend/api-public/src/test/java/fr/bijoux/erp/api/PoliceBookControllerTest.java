package fr.bijoux.erp.api;

import com.fasterxml.jackson.databind.ObjectMapper;
import fr.bijoux.erp.police.domain.model.PoliceBookEntry;
import fr.bijoux.erp.police.domain.model.PoliceEntryType;
import fr.bijoux.erp.police.domain.service.PoliceBookService;
import fr.bijoux.erp.police.dto.PoliceBookCreateRequest;
import fr.bijoux.erp.police.dto.PoliceBookExitRequest;
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
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(PoliceBookController.class)
@AutoConfigureMockMvc(addFilters = false)
@DisplayName("Tests du contrôleur REST Livre de Police (PoliceBookController)")
class PoliceBookControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private PoliceBookService policeBookService;

    @MockBean
    private fr.bijoux.erp.core.security.jwt.JwtTokenProvider jwtTokenProvider;

    @Test
    @DisplayName("GET /api/v1/police-book/entries - Doit retourner les entrées du magasin")
    void shouldGetEntriesByStore() throws Exception {
        PoliceBookEntry entry = new PoliceBookEntry(
                1L,
                1L,
                Instant.now(),
                PoliceEntryType.ACHAT_PARTICULIER,
                "Bague or jaune 18 carats",
                "OR",
                "750",
                new BigDecimal("5.20"),
                new BigDecimal("5.00"),
                "Tête d'aigle",
                "Jean Dupont",
                "CNI-123456789",
                "10 rue de la Paix 75001 Paris",
                25000L,
                "PREV_HASH",
                "CURR_HASH",
                "HMAC_SIG"
        );
        entry.setId(1L);

        when(policeBookService.getEntriesByStore(1L)).thenReturn(List.of(entry));

        mockMvc.perform(get("/api/v1/police-book/entries").param("storeId", "1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].sequenceNumber").value(1))
                .andExpect(jsonPath("$[0].itemDescription").value("Bague or jaune 18 carats"))
                .andExpect(jsonPath("$[0].sellerFullName").value("Jean Dupont"));
    }

    @Test
    @DisplayName("POST /api/v1/police-book/entries - Doit enregistrer une nouvelle entrée")
    void shouldCreateEntry() throws Exception {
        PoliceBookCreateRequest request = new PoliceBookCreateRequest(
                1L,
                PoliceEntryType.ACHAT_PARTICULIER,
                "Collier or 18k",
                "OR",
                "750",
                new BigDecimal("12.50"),
                new BigDecimal("12.00"),
                "Tête d'aigle",
                "Marie Curie",
                "PASSPORT-FR-987",
                "15 avenue Foch 75016 Paris",
                60000L,
                Instant.now()
        );

        PoliceBookEntry entry = new PoliceBookEntry(
                2L,
                1L,
                request.entryDate(),
                request.entryType(),
                request.itemDescription(),
                request.metalType(),
                request.fineness(),
                request.grossWeightGrams(),
                request.estimatedNetWeightGrams(),
                request.hallmarks(),
                request.sellerFullName(),
                request.sellerCniPassport(),
                request.sellerAddress(),
                request.purchasePriceCents(),
                "PREV_HASH_1",
                "CURR_HASH_2",
                "HMAC_SIG_2"
        );
        entry.setId(2L);

        when(policeBookService.recordEntry(
                eq(1L), any(), any(), any(), any(), any(), any(), any(), any(), any(), any(), anyLong(), any()
        )).thenReturn(entry);

        mockMvc.perform(post("/api/v1/police-book/entries")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.sequenceNumber").value(2))
                .andExpect(jsonPath("$.sellerCniPassport").value("PASSPORT-FR-987"));
    }

    @Test
    @DisplayName("GET /api/v1/police-book/export - Doit exporter en CSV officiel Douanes")
    void shouldExportCustomsCsv() throws Exception {
        byte[] csvBytes = "NUMERO_ORDRE;DATE_DEPOT;DESCRIPTION\n1;2026-11-05;Bague Or".getBytes();
        when(policeBookService.exportRequisitionCsv(eq(1L), any(), any())).thenReturn(csvBytes);

        mockMvc.perform(get("/api/v1/police-book/export")
                        .param("storeId", "1")
                        .param("from", "2026-01-01T00:00:00Z")
                        .param("to", "2026-12-31T23:59:59Z"))
                .andExpect(status().isOk())
                .andExpect(header().string("Content-Disposition", "attachment; filename=\"livre_de_police_magasin_1.csv\""))
                .andExpect(content().contentType("text/csv;charset=UTF-8"));
    }
}
