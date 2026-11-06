package fr.bijoux.erp.api;

import fr.bijoux.erp.catalog.domain.service.SupplierOrderService;
import fr.bijoux.erp.catalog.dto.CreateSupplierOrderRequest;
import fr.bijoux.erp.catalog.dto.ReceiveOrderRequest;
import fr.bijoux.erp.catalog.dto.SupplierOrderResponse;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/supplier-orders")
public class SupplierOrderController {

    private final SupplierOrderService supplierOrderService;

    public SupplierOrderController(SupplierOrderService supplierOrderService) {
        this.supplierOrderService = supplierOrderService;
    }

    @PostMapping
    public ResponseEntity<SupplierOrderResponse> createOrder(@Valid @RequestBody CreateSupplierOrderRequest request) {
        SupplierOrderResponse response = supplierOrderService.createOrder(
                request.storeId(),
                request.supplierName(),
                request.items()
        );
        return ResponseEntity.ok(response);
    }

    @PostMapping("/{id}/receive")
    public ResponseEntity<SupplierOrderResponse> receiveOrder(
            @PathVariable Long id,
            @RequestParam(required = false) String destinationStock,
            @RequestBody(required = false) ReceiveOrderRequest request) {
        String dest = destinationStock != null && !destinationStock.isBlank()
                ? destinationStock
                : (request != null ? request.destinationStock() : null);

        if (dest == null || dest.isBlank()) {
            dest = "VITRINE"; // Default si non spécifié
        }

        SupplierOrderResponse response = supplierOrderService.receiveOrder(id, dest);
        return ResponseEntity.ok(response);
    }

    @PatchMapping("/{id}/receive")
    public ResponseEntity<SupplierOrderResponse> receiveOrderPatch(
            @PathVariable Long id,
            @RequestParam(required = false) String destinationStock,
            @RequestBody(required = false) ReceiveOrderRequest request) {
        return receiveOrder(id, destinationStock, request);
    }

    @GetMapping("/{id}")
    public ResponseEntity<SupplierOrderResponse> getOrder(@PathVariable Long id) {
        SupplierOrderResponse response = supplierOrderService.getOrderById(id);
        return ResponseEntity.ok(response);
    }

    @GetMapping
    public ResponseEntity<List<SupplierOrderResponse>> getOrders(@RequestParam Long storeId) {
        List<SupplierOrderResponse> orders = supplierOrderService.getOrdersByStore(storeId);
        return ResponseEntity.ok(orders);
    }
}
