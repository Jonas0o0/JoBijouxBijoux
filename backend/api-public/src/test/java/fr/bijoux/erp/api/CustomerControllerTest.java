package fr.bijoux.erp.api;

import com.fasterxml.jackson.databind.ObjectMapper;
import fr.bijoux.erp.crm.domain.model.MeasurementType;
import fr.bijoux.erp.crm.domain.service.CustomerService;
import fr.bijoux.erp.crm.dto.AddMeasurementRequest;
import fr.bijoux.erp.crm.dto.CreateCustomerRequest;
import fr.bijoux.erp.crm.dto.CustomerDto;
import fr.bijoux.erp.crm.dto.CustomerDto.MeasurementDetailDto;
import fr.bijoux.erp.crm.dto.UpdateCustomerRequest;
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
import java.time.LocalDate;
import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(CustomerController.class)
@AutoConfigureMockMvc(addFilters = false)
@DisplayName("Tests du contrôleur REST CRM Client (CustomerController)")
class CustomerControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private CustomerService customerService;

    @MockBean
    private fr.bijoux.erp.core.security.jwt.JwtTokenProvider jwtTokenProvider;

    @Test
    @DisplayName("POST /api/v1/customers - Doit créer un client et retourner 201 CREATED")
    void shouldCreateCustomer() throws Exception {
        CreateCustomerRequest request = new CreateCustomerRequest(
                "Claire",
                "Chazal",
                "claire.chazal@example.com",
                "0612345678",
                "8 rue de Rivoli",
                "Paris",
                "75001",
                "CNI-FR-554433",
                LocalDate.of(2030, 1, 1),
                "Cliente VIP joaillerie"
        );

        CustomerDto dto = new CustomerDto(
                1L,
                "Claire",
                "Chazal",
                "claire.chazal@example.com",
                "0612345678",
                "8 rue de Rivoli",
                "Paris",
                "75001",
                "CNI-FR-554433",
                LocalDate.of(2030, 1, 1),
                "Cliente VIP joaillerie",
                Instant.now(),
                List.of()
        );

        when(customerService.createCustomer(any(CreateCustomerRequest.class))).thenReturn(dto);

        mockMvc.perform(post("/api/v1/customers")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").value(1))
                .andExpect(jsonPath("$.firstName").value("Claire"))
                .andExpect(jsonPath("$.lastName").value("Chazal"))
                .andExpect(jsonPath("$.cniPassportNumber").value("CNI-FR-554433"));
    }

    @Test
    @DisplayName("POST /api/v1/customers/{id}/measurements - Doit ajouter une taille de bague baguier")
    void shouldAddMeasurement() throws Exception {
        AddMeasurementRequest request = new AddMeasurementRequest(
                MeasurementType.TAILLE_DOIGT_BAGUIER,
                new BigDecimal("52.00"),
                "Annulaire Gauche"
        );

        MeasurementDetailDto measurementDto = new MeasurementDetailDto(
                10L,
                MeasurementType.TAILLE_DOIGT_BAGUIER,
                new BigDecimal("52.00"),
                "Annulaire Gauche",
                Instant.now()
        );

        CustomerDto dto = new CustomerDto(
                1L,
                "Claire",
                "Chazal",
                "claire.chazal@example.com",
                "0612345678",
                "8 rue de Rivoli",
                "Paris",
                "75001",
                "CNI-FR-554433",
                LocalDate.of(2030, 1, 1),
                "Cliente VIP joaillerie",
                Instant.now(),
                List.of(measurementDto)
        );

        when(customerService.addMeasurement(eq(1L), any(AddMeasurementRequest.class))).thenReturn(dto);

        mockMvc.perform(post("/api/v1/customers/1/measurements")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.measurements[0].measurementType").value("TAILLE_DOIGT_BAGUIER"))
                .andExpect(jsonPath("$.measurements[0].value").value(52.00))
                .andExpect(jsonPath("$.measurements[0].fingerName").value("Annulaire Gauche"));
    }
}
