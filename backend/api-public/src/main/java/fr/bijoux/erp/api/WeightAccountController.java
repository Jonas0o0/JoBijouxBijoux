package fr.bijoux.erp.api;

import fr.bijoux.erp.weightaccount.domain.model.WeightAccountLedger;
import fr.bijoux.erp.weightaccount.domain.service.WeightAccountService;
import fr.bijoux.erp.weightaccount.dto.GoldFixingDto;
import fr.bijoux.erp.weightaccount.dto.RecordFixingRequest;
import fr.bijoux.erp.weightaccount.dto.WeightAccountBalanceDto;
import fr.bijoux.erp.weightaccount.dto.WeightMovementRequest;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/weight-account")
public class WeightAccountController {

    private final WeightAccountService weightAccountService;

    public WeightAccountController(WeightAccountService weightAccountService) {
        this.weightAccountService = weightAccountService;
    }

    @GetMapping("/balance")
    public ResponseEntity<WeightAccountBalanceDto> getBalance(
            @RequestParam Long storeId,
            @RequestParam String partnerName,
            @RequestParam(defaultValue = "GOLD") String metalType) {
        WeightAccountBalanceDto balance = weightAccountService.getCurrentBalance(storeId, partnerName, metalType);
        return ResponseEntity.ok(balance);
    }

    @PostMapping("/movements")
    public ResponseEntity<WeightAccountLedger> recordMovement(@Valid @RequestBody WeightMovementRequest request) {
        WeightAccountLedger ledger = weightAccountService.recordMovement(request);
        return ResponseEntity.ok(ledger);
    }

    @GetMapping("/fixing")
    public ResponseEntity<GoldFixingDto> getLatestFixing(@RequestParam(defaultValue = "GOLD") String metalType) {
        GoldFixingDto fixing = weightAccountService.getLatestFixing(metalType);
        return ResponseEntity.ok(fixing);
    }

    @PostMapping("/fixing")
    public ResponseEntity<GoldFixingDto> recordFixing(@Valid @RequestBody RecordFixingRequest request) {
        GoldFixingDto fixing = weightAccountService.recordFixing(request);
        return ResponseEntity.ok(fixing);
    }
}
