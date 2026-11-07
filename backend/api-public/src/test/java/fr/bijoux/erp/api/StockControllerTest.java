package fr.bijoux.erp.api;

import com.fasterxml.jackson.databind.ObjectMapper;
import fr.bijoux.erp.catalog.domain.model.JewelryItem;
import fr.bijoux.erp.catalog.domain.model.JewelryItemStatus;
import fr.bijoux.erp.catalog.domain.service.JewelryCatalogService;
import fr.bijoux.erp.catalog.dto.StockTransferRequest;
import fr.bijoux.erp.core.domain.valueobject.GoldFineness;
import fr.bijoux.erp.core.domain.valueobject.MoneyAmount;
import fr.bijoux.erp.core.domain.valueobject.WeightInGrams;
import fr.bijoux.erp.core.security.jwt.JwtTokenProvider;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(StockController.class)
@AutoConfigureMockMvc(addFilters = false)
@DisplayName("Tests du contrôleur REST Stock & Transferts inter-boutiques")
class StockControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private JewelryCatalogService catalogService;

    @MockBean
    private JwtTokenProvider jwtTokenProvider;

    @Test
    @DisplayName("GET /api/v1/stock/items - Doit lister les bijoux du magasin")
    void shouldListItems() throws Exception {
        JewelryItem item = new JewelryItem(
                "SN-DIA-001",
                "REF-SOL-01",
                "Solitaire Diamant 1.05ct Platine",
                GoldFineness.PLATINE_950,
                new WeightInGrams(new BigDecimal("4.50")),
                MoneyAmount.ofCents(340000L),
                MoneyAmount.ofCents(160000L),
                null,
                1L
        );
        item.setStatus(JewelryItemStatus.EN_VITRINE);

        when(catalogService.findItemsByStore(1L, null)).thenReturn(List.of(item));

        mockMvc.perform(get("/api/v1/stock/items").param("storeId", "1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].serialNumber").value("SN-DIA-001"))
                .andExpect(jsonPath("$[0].designation").value("Solitaire Diamant 1.05ct Platine"));
    }

    @Test
    @DisplayName("POST /api/v1/stock/items/{id}/transfer-store - Doit transférer un bijou vers Cannes")
    void shouldTransferItemToStore() throws Exception {
        StockTransferRequest request = new StockTransferRequest(
                3L,
                null,
                "BRINKS_SECURITY",
                "TR-2026-0042",
                "vendeuse_paris",
                "Demande client VIP Cannes"
        );

        JewelryItem transferred = new JewelryItem(
                "SN-DIA-001",
                "REF-SOL-01",
                "Solitaire Diamant 1.05ct Platine",
                GoldFineness.PLATINE_950,
                new WeightInGrams(new BigDecimal("4.50")),
                MoneyAmount.ofCents(340000L),
                MoneyAmount.ofCents(160000L),
                null,
                3L
        );

        when(catalogService.transferToStore(eq(10L), eq(3L), any(), any(), eq("TR-2026-0042"), any()))
                .thenReturn(transferred);

        mockMvc.perform(post("/api/v1/stock/items/10/transfer-store")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.storeId").value(3L));
    }
}
