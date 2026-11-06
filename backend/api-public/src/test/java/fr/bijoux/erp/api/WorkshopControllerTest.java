package fr.bijoux.erp.api;

import com.fasterxml.jackson.databind.ObjectMapper;
import fr.bijoux.erp.workshop.domain.model.WorkshopStatus;
import fr.bijoux.erp.workshop.domain.service.WorkshopService;
import fr.bijoux.erp.workshop.dto.RepairInvoiceDto;
import fr.bijoux.erp.workshop.dto.RepairOrderResponse;
import fr.bijoux.erp.workshop.dto.WorkshopStatusUpdateRequest;
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
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(WorkshopController.class)
@AutoConfigureMockMvc(addFilters = false)
@DisplayName("Tests du contrôleur REST Atelier (WorkshopController)")
class WorkshopControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private WorkshopService workshopService;

    @MockBean
    private fr.bijoux.erp.core.security.jwt.JwtTokenProvider jwtTokenProvider;

    @Test
    @DisplayName("GET /api/v1/workshop/orders - Doit lister les ordres de réparation")
    void shouldGetRepairOrders() throws Exception {
        RepairOrderResponse response = new RepairOrderResponse(
                1L,
                "SAV-20261105-0001",
                1L,
                10L,
                "OP_ADMIN",
                "ARTISAN_PIERRE",
                WorkshopStatus.DEPOT,
                "Bague solitaire",
                "OR",
                "750",
                new BigDecimal("3.50"),
                "photo1.jpg",
                "schema.svg",
                12000L,
                null,
                "Mise à taille 54",
                Instant.now(),
                null,
                null
        );

        when(workshopService.getRepairOrdersByStore(1L)).thenReturn(List.of(response));

        mockMvc.perform(get("/api/v1/workshop/orders").param("storeId", "1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].orderNumber").value("SAV-20261105-0001"))
                .andExpect(jsonPath("$[0].itemDescription").value("Bague solitaire"))
                .andExpect(jsonPath("$[0].status").value("DEPOT"));
    }

    @Test
    @DisplayName("PATCH /api/v1/workshop/orders/{id}/status - Doit modifier le statut de l'ordre SAV")
    void shouldUpdateRepairStatus() throws Exception {
        WorkshopStatusUpdateRequest request = new WorkshopStatusUpdateRequest(
                WorkshopStatus.EN_COURS,
                "ARTISAN_PIERRE",
                null,
                "Démarrage travail à l'établi"
        );

        RepairOrderResponse response = new RepairOrderResponse(
                1L,
                "SAV-20261105-0001",
                1L,
                10L,
                "OP_ADMIN",
                "ARTISAN_PIERRE",
                WorkshopStatus.EN_COURS,
                "Bague solitaire",
                "OR",
                "750",
                new BigDecimal("3.50"),
                "photo1.jpg",
                "schema.svg",
                12000L,
                null,
                "Démarrage travail à l'établi",
                Instant.now(),
                null,
                null
        );

        when(workshopService.updateRepairStatus(eq(1L), any(WorkshopStatusUpdateRequest.class))).thenReturn(response);

        mockMvc.perform(patch("/api/v1/workshop/orders/1/status")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("EN_COURS"));
    }

    @Test
    @DisplayName("GET /api/v1/workshop/orders/{id}/invoice - Doit retourner le décompte de facturation SAV")
    void shouldGetRepairInvoice() throws Exception {
        RepairInvoiceDto invoice = new RepairInvoiceDto(
                1L,
                "REP-1-000001",
                1L,
                42L,
                "Mise à taille bague or 750",
                "OR",
                "750‰",
                new BigDecimal("4.500"),
                18_000L,
                5_000L,
                13_000L,
                new RepairInvoiceDto.LaborDetailDto("Façon atelier", 13_000L),
                List.of(new RepairInvoiceDto.SupplyDetailDto("Or apport soudure", 1, 2_000L, 2_000L)),
                "PRET_RETRAIT",
                Instant.now()
        );

        when(workshopService.prepareRepairInvoice(1L)).thenReturn(invoice);

        mockMvc.perform(get("/api/v1/workshop/orders/1/invoice"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.repairOrderId").value(1))
                .andExpect(jsonPath("$.orderNumber").value("REP-1-000001"))
                .andExpect(jsonPath("$.totalCostCents").value(18000))
                .andExpect(jsonPath("$.depositPaidCents").value(5000))
                .andExpect(jsonPath("$.remainingBalanceCents").value(13000))
                .andExpect(jsonPath("$.labor.amountCents").value(13000))
                .andExpect(jsonPath("$.supplies[0].componentName").value("Or apport soudure"));
    }
}
