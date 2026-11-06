package fr.bijoux.erp.api;

import com.fasterxml.jackson.databind.ObjectMapper;
import fr.bijoux.erp.catalog.domain.model.SupplierOrderStatus;
import fr.bijoux.erp.catalog.domain.service.SupplierOrderService;
import fr.bijoux.erp.catalog.dto.CreateSupplierOrderRequest;
import fr.bijoux.erp.catalog.dto.OrderItemDto;
import fr.bijoux.erp.catalog.dto.ReceiveOrderRequest;
import fr.bijoux.erp.catalog.dto.SupplierOrderResponse;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
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

@WebMvcTest(SupplierOrderController.class)
@AutoConfigureMockMvc(addFilters = false)
@DisplayName("Tests du contrôleur REST Commandes Fournisseurs (SupplierOrderController)")
class SupplierOrderControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private SupplierOrderService supplierOrderService;

    @MockBean
    private fr.bijoux.erp.core.security.jwt.JwtTokenProvider jwtTokenProvider;

    @Test
    @DisplayName("POST /api/v1/supplier-orders - Doit créer une commande fournisseur")
    void shouldCreateSupplierOrder() throws Exception {
        CreateSupplierOrderRequest request = new CreateSupplierOrderRequest(
                1L,
                "Fournisseur Diamantaire",
                List.of(new OrderItemDto("REF-1", "Bague Or", 2, 20_000L))
        );

        SupplierOrderResponse response = new SupplierOrderResponse(
                1L,
                "SUP-1-000001",
                1L,
                "Fournisseur Diamantaire",
                SupplierOrderStatus.COMMANDE,
                null,
                40_000L,
                8_000L,
                48_000L,
                null,
                Instant.now(),
                Instant.now(),
                null,
                List.of()
        );

        when(supplierOrderService.createOrder(eq(1L), eq("Fournisseur Diamantaire"), any())).thenReturn(response);

        mockMvc.perform(post("/api/v1/supplier-orders")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.orderNumber").value("SUP-1-000001"))
                .andExpect(jsonPath("$.status").value("COMMANDE"))
                .andExpect(jsonPath("$.totalAmountTtcCents").value(48000));
    }

    @Test
    @DisplayName("POST /api/v1/supplier-orders/{id}/receive - Doit réceptionner en vitrine")
    void shouldReceiveSupplierOrder() throws Exception {
        ReceiveOrderRequest req = new ReceiveOrderRequest("VITRINE");

        SupplierOrderResponse response = new SupplierOrderResponse(
                1L,
                "SUP-1-000001",
                1L,
                "Fournisseur Diamantaire",
                SupplierOrderStatus.RECEPTIONNE,
                "VITRINE",
                40_000L,
                8_000L,
                48_000L,
                null,
                Instant.now(),
                Instant.now(),
                Instant.now(),
                List.of()
        );

        when(supplierOrderService.receiveOrder(eq(1L), eq("VITRINE"))).thenReturn(response);

        mockMvc.perform(post("/api/v1/supplier-orders/1/receive")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("RECEPTIONNE"))
                .andExpect(jsonPath("$.destinationStock").value("VITRINE"));
    }

    @Test
    @DisplayName("GET /api/v1/supplier-orders/{id} - Doit retourner la commande")
    void shouldGetOrderById() throws Exception {
        SupplierOrderResponse response = new SupplierOrderResponse(
                1L,
                "SUP-1-000001",
                1L,
                "Fournisseur Diamantaire",
                SupplierOrderStatus.COMMANDE,
                null,
                40_000L,
                8_000L,
                48_000L,
                null,
                Instant.now(),
                Instant.now(),
                null,
                List.of()
        );

        when(supplierOrderService.getOrderById(1L)).thenReturn(response);

        mockMvc.perform(get("/api/v1/supplier-orders/1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.orderNumber").value("SUP-1-000001"));
    }
}
