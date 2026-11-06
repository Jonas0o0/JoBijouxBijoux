package fr.bijoux.erp.api;

import fr.bijoux.erp.workshop.domain.service.WorkshopService;
import fr.bijoux.erp.workshop.dto.*;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/workshop")
public class WorkshopController {

    private final WorkshopService workshopService;

    public WorkshopController(WorkshopService workshopService) {
        this.workshopService = workshopService;
    }

    @PostMapping("/orders/repair")
    public ResponseEntity<RepairOrderResponse> createRepairOrder(@Valid @RequestBody CreateRepairOrderRequest request) {
        RepairOrderResponse response = workshopService.createRepairOrder(request);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/orders/custom")
    public ResponseEntity<CustomOrderResponse> createCustomOrder(@Valid @RequestBody CreateCustomOrderRequest request) {
        CustomOrderResponse response = workshopService.createCustomOrder(request);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/orders")
    public ResponseEntity<List<RepairOrderResponse>> getRepairOrders(@RequestParam Long storeId) {
        List<RepairOrderResponse> list = workshopService.getRepairOrdersByStore(storeId);
        return ResponseEntity.ok(list);
    }

    @PatchMapping("/orders/{id}/status")
    public ResponseEntity<RepairOrderResponse> updateRepairStatus(@PathVariable Long id,
                                                                 @Valid @RequestBody WorkshopStatusUpdateRequest request) {
        RepairOrderResponse response = workshopService.updateRepairStatus(id, request);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/orders/{id}/invoice")
    public ResponseEntity<RepairInvoiceDto> getRepairInvoice(@PathVariable Long id) {
        RepairInvoiceDto invoice = workshopService.prepareRepairInvoice(id);
        return ResponseEntity.ok(invoice);
    }
}
