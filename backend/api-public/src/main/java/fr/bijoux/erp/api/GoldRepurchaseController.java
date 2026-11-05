package fr.bijoux.erp.api;

import fr.bijoux.erp.gold.domain.model.GoldPaymentMethod;
import fr.bijoux.erp.gold.domain.service.GoldRepurchaseService;
import fr.bijoux.erp.gold.dto.CreateGoldDossierRequest;
import fr.bijoux.erp.gold.dto.GoldDossierResponse;
import fr.bijoux.erp.gold.dto.GoldEstimateRequest;
import fr.bijoux.erp.gold.dto.GoldEstimateResponse;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/gold")
public class GoldRepurchaseController {

    private final GoldRepurchaseService goldService;

    public GoldRepurchaseController(GoldRepurchaseService goldService) {
        this.goldService = goldService;
    }

    @PostMapping("/estimate")
    public ResponseEntity<GoldEstimateResponse> estimate(@Valid @RequestBody GoldEstimateRequest request) {
        GoldEstimateResponse response = goldService.estimate(request);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/dossiers")
    public ResponseEntity<GoldDossierResponse> createDossier(@Valid @RequestBody CreateGoldDossierRequest request) {
        GoldDossierResponse response = goldService.createDossier(request);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/dossiers/{id}")
    public ResponseEntity<GoldDossierResponse> getDossier(@PathVariable Long id) {
        GoldDossierResponse response = goldService.getDossier(id);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/dossiers/{id}/sign")
    public ResponseEntity<GoldDossierResponse> signDossier(@PathVariable Long id,
                                                           @RequestParam(required = false) GoldPaymentMethod method) {
        GoldDossierResponse response = goldService.signDossier(id, method);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/dossiers/{id}/finalize")
    public ResponseEntity<GoldDossierResponse> finalizeDossier(
            @PathVariable Long id,
            @RequestParam(defaultValue = "false") boolean ignoreQuarantine) {
        GoldDossierResponse response = goldService.finalizeDossier(id, ignoreQuarantine);
        return ResponseEntity.ok(response);
    }
}
