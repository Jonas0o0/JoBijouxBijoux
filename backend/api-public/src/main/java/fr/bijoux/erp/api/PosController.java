package fr.bijoux.erp.api;

import fr.bijoux.erp.pos.domain.model.FiscalClosure;
import fr.bijoux.erp.pos.domain.service.CheckoutService;
import fr.bijoux.erp.pos.domain.service.FiscalClosureService;
import fr.bijoux.erp.pos.dto.CartValidationResult;
import fr.bijoux.erp.pos.dto.CheckoutRepairRequest;
import fr.bijoux.erp.pos.dto.CheckoutRequest;
import fr.bijoux.erp.pos.dto.CheckoutResponse;
import fr.bijoux.erp.pos.dto.FiscalClosureDto;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/pos")
public class PosController {

    private final CheckoutService checkoutService;
    private final FiscalClosureService closureService;

    public PosController(CheckoutService checkoutService, FiscalClosureService closureService) {
        this.checkoutService = checkoutService;
        this.closureService = closureService;
    }

    @PostMapping("/checkout")
    public ResponseEntity<CheckoutResponse> checkout(@Valid @RequestBody CheckoutRequest request) {
        CheckoutResponse response = checkoutService.processCheckout(request);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/checkout/repair")
    public ResponseEntity<CheckoutResponse> checkoutRepair(@Valid @RequestBody CheckoutRepairRequest request) {
        CheckoutResponse response = checkoutService.checkoutRepair(request);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/cart/validate")
    public ResponseEntity<CartValidationResult> validateCart(@Valid @RequestBody List<CheckoutRequest.CartLineDto> lines) {
        CartValidationResult result = checkoutService.validateCart(lines);
        return ResponseEntity.ok(result);
    }

    @PostMapping("/closures/z")
    public ResponseEntity<FiscalClosureDto> executeDailyZ(@RequestParam Long storeId,
                                                         @RequestParam String operator) {
        FiscalClosure closure = closureService.executeDailyZ(storeId, operator);
        return ResponseEntity.ok(FiscalClosureDto.fromEntity(closure));
    }

    @GetMapping("/closures/x")
    public ResponseEntity<FiscalClosureDto> executeInterimX(@RequestParam Long storeId,
                                                           @RequestParam String operator) {
        FiscalClosure closure = closureService.executeInterimX(storeId, operator);
        return ResponseEntity.ok(FiscalClosureDto.fromEntity(closure));
    }
}
