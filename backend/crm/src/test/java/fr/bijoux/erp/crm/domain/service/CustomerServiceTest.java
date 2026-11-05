package fr.bijoux.erp.crm.domain.service;

import fr.bijoux.erp.crm.domain.model.Customer;
import fr.bijoux.erp.crm.domain.model.MeasurementType;
import fr.bijoux.erp.crm.domain.repository.CustomerMeasurementRepository;
import fr.bijoux.erp.crm.domain.repository.CustomerRepository;
import fr.bijoux.erp.crm.dto.AddMeasurementRequest;
import fr.bijoux.erp.crm.dto.CreateCustomerRequest;
import fr.bijoux.erp.crm.dto.CustomerDto;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("Tests Unitaires - CRM Client, KYC & Baguier")
class CustomerServiceTest {

    @Mock
    private CustomerRepository customerRepository;

    @Mock
    private CustomerMeasurementRepository measurementRepository;

    private CustomerService customerService;

    @BeforeEach
    void setUp() {
        customerService = new CustomerService(customerRepository, measurementRepository);
    }

    @Test
    @DisplayName("Doit créer une fiche client complète avec justificatif CNI pour KYC")
    void shouldCreateCustomer() {
        when(customerRepository.findByEmail("sophie.valois@example.com")).thenReturn(Optional.empty());
        when(customerRepository.save(any(Customer.class))).thenAnswer(inv -> {
            Customer c = inv.getArgument(0);
            c.setId(100L);
            return c;
        });

        CreateCustomerRequest request = new CreateCustomerRequest(
                "Sophie",
                "Valois",
                "sophie.valois@example.com",
                "+33 6 12 34 56 78",
                "15 place Vendôme",
                "Paris",
                "75001",
                "CNI-FR-987654321",
                LocalDate.of(2032, 5, 20),
                "Cliente VIP haute joaillerie"
        );

        CustomerDto created = customerService.createCustomer(request);

        assertThat(created.id()).isEqualTo(100L);
        assertThat(created.firstName()).isEqualTo("Sophie");
        assertThat(created.lastName()).isEqualTo("Valois");
        assertThat(created.cniPassportNumber()).isEqualTo("CNI-FR-987654321");
    }

    @Test
    @DisplayName("Baguier : Doit enregistrer une taille de doigt standard (ex: 52 pour annulaire gauche)")
    void shouldAddValidRingSizeMeasurement() {
        Customer customer = new Customer("Sophie", "Valois", "sophie@example.com", null, null, null, null, null, null);
        customer.setId(100L);

        when(customerRepository.findById(100L)).thenReturn(Optional.of(customer));
        when(customerRepository.save(any(Customer.class))).thenAnswer(inv -> inv.getArgument(0));

        AddMeasurementRequest req = new AddMeasurementRequest(
                MeasurementType.TAILLE_DOIGT_BAGUIER,
                new BigDecimal("52.00"),
                "Annulaire gauche"
        );

        CustomerDto updated = customerService.addMeasurement(100L, req);

        assertThat(updated.measurements()).hasSize(1);
        assertThat(updated.measurements().get(0).value()).isEqualByComparingTo(new BigDecimal("52.00"));
        assertThat(updated.measurements().get(0).fingerName()).isEqualTo("Annulaire gauche");
    }

    @Test
    @DisplayName("Baguier : Doit rejeter une taille de bague aberrante hors limites joaillières")
    void shouldRejectInvalidRingSize() {
        Customer customer = new Customer("Sophie", "Valois", null, null, null, null, null, null, null);
        customer.setId(100L);

        when(customerRepository.findById(100L)).thenReturn(Optional.of(customer));

        AddMeasurementRequest tooSmall = new AddMeasurementRequest(
                MeasurementType.TAILLE_DOIGT_BAGUIER,
                new BigDecimal("25.00"),
                "Auriculaire"
        );

        assertThatThrownBy(() -> customerService.addMeasurement(100L, tooSmall))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Taille de bague non standard");

        AddMeasurementRequest tooLarge = new AddMeasurementRequest(
                MeasurementType.TAILLE_DOIGT_BAGUIER,
                new BigDecimal("85.00"),
                "Pouce"
        );

        assertThatThrownBy(() -> customerService.addMeasurement(100L, tooLarge))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Taille de bague non standard");
    }
}
