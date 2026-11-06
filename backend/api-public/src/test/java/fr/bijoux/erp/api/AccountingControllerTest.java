package fr.bijoux.erp.api;

import fr.bijoux.erp.pos.domain.service.FecExportService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.nio.charset.StandardCharsets;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(AccountingController.class)
@AutoConfigureMockMvc(addFilters = false)
@DisplayName("Tests du contrôleur REST Comptabilité & FEC (AccountingController)")
class AccountingControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private FecExportService fecExportService;

    @MockBean
    private fr.bijoux.erp.core.security.jwt.JwtTokenProvider jwtTokenProvider;

    @Test
    @DisplayName("GET /api/v1/accounting/fec - Doit exporter le fichier FEC officiel conforme DGFIP")
    void shouldExportFecFile() throws Exception {
        String mockFec = FecExportService.FEC_HEADER + "\r\n" +
                "VT\tJournal des Ventes Joaillerie\t1\t20261106\t512\tBanque / CB\t\t\tTKT-1-000001\t20261106\tEncaissement CARD\t120,00\t0,00\t\t\t20261106\t\t\r\n" +
                "VT\tJournal des Ventes Joaillerie\t1\t20261106\t707\tVentes marchandises neuves\t\t\tTKT-1-000001\t20261106\tBague Or 750\t0,00\t100,00\t\t\t20261106\t\t\r\n" +
                "VT\tJournal des Ventes Joaillerie\t1\t20261106\t44571\tTVA collectée\t\t\tTKT-1-000001\t20261106\tTVA collectée\t0,00\t20,00\t\t\t20261106\t\t\r\n";

        byte[] bytes = mockFec.getBytes(StandardCharsets.UTF_8);

        when(fecExportService.generateFecBytes(eq(1L), any(java.time.LocalDate.class), any(java.time.LocalDate.class))).thenReturn(bytes);

        mockMvc.perform(get("/api/v1/accounting/fec")
                        .param("storeId", "1")
                        .param("startDate", "2026-11-01")
                        .param("endDate", "2026-11-30"))
                .andExpect(status().isOk())
                .andExpect(header().string(HttpHeaders.CONTENT_DISPOSITION, org.hamcrest.Matchers.containsString("FEC_MAG1_20261101_20261130.txt")))
                .andExpect(header().string(HttpHeaders.CONTENT_TYPE, org.hamcrest.Matchers.containsString("text/plain")))
                .andExpect(content().string(org.hamcrest.Matchers.containsString("JournalCode\tJournalLib\tEcritureNum")))
                .andExpect(content().string(org.hamcrest.Matchers.containsString("707\tVentes marchandises neuves")));
    }
}
