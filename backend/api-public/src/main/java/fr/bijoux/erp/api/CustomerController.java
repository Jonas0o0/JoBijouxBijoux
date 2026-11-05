package fr.bijoux.erp.api;

import fr.bijoux.erp.crm.domain.service.CustomerService;
import fr.bijoux.erp.crm.dto.AddMeasurementRequest;
import fr.bijoux.erp.crm.dto.CreateCustomerRequest;
import fr.bijoux.erp.crm.dto.CustomerDto;
import fr.bijoux.erp.crm.dto.UpdateCustomerRequest;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/customers")
public class CustomerController {

    private final CustomerService customerService;

    public CustomerController(CustomerService customerService) {
        this.customerService = customerService;
    }

    @PostMapping
    public ResponseEntity<CustomerDto> createCustomer(@Valid @RequestBody CreateCustomerRequest request) {
        CustomerDto customer = customerService.createCustomer(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(customer);
    }

    @GetMapping
    public ResponseEntity<List<CustomerDto>> searchCustomers(@RequestParam(required = false) String query) {
        List<CustomerDto> results = customerService.search(query);
        return ResponseEntity.ok(results);
    }

    @GetMapping("/{id}")
    public ResponseEntity<CustomerDto> getCustomerById(@PathVariable Long id) {
        CustomerDto customer = customerService.findById(id);
        return ResponseEntity.ok(customer);
    }

    @PutMapping("/{id}")
    public ResponseEntity<CustomerDto> updateCustomer(@PathVariable Long id,
                                                      @Valid @RequestBody UpdateCustomerRequest request) {
        CustomerDto updated = customerService.updateCustomer(id, request);
        return ResponseEntity.ok(updated);
    }

    @PostMapping("/{id}/measurements")
    public ResponseEntity<CustomerDto> addMeasurement(@PathVariable Long id,
                                                      @Valid @RequestBody AddMeasurementRequest request) {
        CustomerDto updated = customerService.addMeasurement(id, request);
        return ResponseEntity.ok(updated);
    }
}
