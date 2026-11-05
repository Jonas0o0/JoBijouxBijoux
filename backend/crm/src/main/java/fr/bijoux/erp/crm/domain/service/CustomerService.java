package fr.bijoux.erp.crm.domain.service;

import fr.bijoux.erp.crm.domain.model.Customer;
import fr.bijoux.erp.crm.domain.model.CustomerMeasurement;
import fr.bijoux.erp.crm.domain.model.MeasurementType;
import fr.bijoux.erp.crm.domain.repository.CustomerMeasurementRepository;
import fr.bijoux.erp.crm.domain.repository.CustomerRepository;
import fr.bijoux.erp.crm.dto.AddMeasurementRequest;
import fr.bijoux.erp.crm.dto.CreateCustomerRequest;
import fr.bijoux.erp.crm.dto.CustomerDto;
import fr.bijoux.erp.crm.dto.UpdateCustomerRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

@Service
public class CustomerService {

    public static final BigDecimal MIN_RING_SIZE = new BigDecimal("44.00");
    public static final BigDecimal MAX_RING_SIZE = new BigDecimal("74.00");

    private final CustomerRepository customerRepository;
    private final CustomerMeasurementRepository measurementRepository;

    public CustomerService(CustomerRepository customerRepository,
                           CustomerMeasurementRepository measurementRepository) {
        this.customerRepository = customerRepository;
        this.measurementRepository = measurementRepository;
    }

    @Transactional
    public CustomerDto createCustomer(CreateCustomerRequest request) {
        if (request.email() != null && !request.email().isBlank() && customerRepository.findByEmail(request.email().trim()).isPresent()) {
            throw new IllegalArgumentException("Un client existe déjà avec l'adresse email : " + request.email());
        }

        Customer customer = new Customer(
                request.firstName().trim(),
                request.lastName().trim(),
                request.email() != null ? request.email().trim().toLowerCase() : null,
                request.phone(),
                request.address(),
                request.city(),
                request.postalCode(),
                request.cniPassportNumber(),
                request.cniExpiryDate()
        );
        customer.setNotes(request.notes());

        Customer saved = customerRepository.save(customer);
        return CustomerDto.fromEntity(saved);
    }

    @Transactional
    public CustomerDto updateCustomer(Long customerId, UpdateCustomerRequest request) {
        Customer customer = customerRepository.findById(customerId)
                .orElseThrow(() -> new IllegalArgumentException("Client introuvable id=" + customerId));

        if (request.firstName() != null && !request.firstName().isBlank()) customer.setFirstName(request.firstName().trim());
        if (request.lastName() != null && !request.lastName().isBlank()) customer.setLastName(request.lastName().trim());
        if (request.email() != null) customer.setEmail(request.email().trim().toLowerCase());
        if (request.phone() != null) customer.setPhone(request.phone());
        if (request.address() != null) customer.setAddress(request.address());
        if (request.city() != null) customer.setCity(request.city());
        if (request.postalCode() != null) customer.setPostalCode(request.postalCode());
        if (request.cniPassportNumber() != null) customer.setCniPassportNumber(request.cniPassportNumber());
        if (request.cniExpiryDate() != null) customer.setCniExpiryDate(request.cniExpiryDate());
        if (request.notes() != null) customer.setNotes(request.notes());

        customer.setUpdatedAt(Instant.now());

        Customer saved = customerRepository.save(customer);
        return CustomerDto.fromEntity(saved);
    }

    @Transactional
    public CustomerDto addMeasurement(Long customerId, AddMeasurementRequest request) {
        Customer customer = customerRepository.findById(customerId)
                .orElseThrow(() -> new IllegalArgumentException("Client introuvable id=" + customerId));

        if (request.measurementType() == MeasurementType.TAILLE_DOIGT_BAGUIER) {
            if (request.value().compareTo(MIN_RING_SIZE) < 0 || request.value().compareTo(MAX_RING_SIZE) > 0) {
                throw new IllegalArgumentException(String.format(
                        "Taille de bague non standard ou invalide : %s (plage baguier autorisée : 44 à 74, usuelle joaillerie 48-64)",
                        request.value()
                ));
            }
        }

        CustomerMeasurement measurement = new CustomerMeasurement(
                request.measurementType(),
                request.value(),
                request.fingerName()
        );
        customer.addMeasurement(measurement);

        Customer saved = customerRepository.save(customer);
        return CustomerDto.fromEntity(saved);
    }

    @Transactional(readOnly = true)
    public CustomerDto findById(Long customerId) {
        return customerRepository.findById(customerId)
                .map(CustomerDto::fromEntity)
                .orElseThrow(() -> new IllegalArgumentException("Client introuvable id=" + customerId));
    }

    @Transactional(readOnly = true)
    public List<CustomerDto> search(String query) {
        List<Customer> list = (query != null && !query.isBlank())
                ? customerRepository.searchByName(query.trim())
                : customerRepository.findAll();

        return list.stream().map(CustomerDto::fromEntity).toList();
    }
}
