package fr.bijoux.erp.api;

import fr.bijoux.erp.catalog.domain.model.JewelryItem;
import fr.bijoux.erp.catalog.domain.model.JewelryItemStatus;
import fr.bijoux.erp.catalog.domain.service.JewelryCatalogService;
import fr.bijoux.erp.catalog.dto.JewelryItemSummaryDto;
import fr.bijoux.erp.catalog.dto.StockTransferRequest;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Contrôleur REST pour la gestion et le transfert de stock inter-boutiques.
 */
@RestController
@RequestMapping("/api/v1/stock")
public class StockController {

    private final JewelryCatalogService catalogService;

    public StockController(JewelryCatalogService catalogService) {
        this.catalogService = catalogService;
    }

    @GetMapping("/items")
    public ResponseEntity<List<JewelryItemSummaryDto>> listItems(
            @RequestParam(required = false) Long storeId,
            @RequestParam(required = false) JewelryItemStatus status) {
        List<JewelryItem> items = catalogService.findItemsByStore(storeId, status);
        List<JewelryItemSummaryDto> dtos = items.stream().map(JewelryItemSummaryDto::fromEntity).toList();
        return ResponseEntity.ok(dtos);
    }

    @GetMapping("/items/{serialNumber}")
    public ResponseEntity<JewelryItemSummaryDto> getItemBySerialNumber(@PathVariable String serialNumber) {
        return catalogService.findBySerialNumber(serialNumber)
                .map(JewelryItemSummaryDto::fromEntity)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping("/items/{id}/transfer-store")
    public ResponseEntity<JewelryItemSummaryDto> transferToStore(
            @PathVariable Long id,
            @Valid @RequestBody StockTransferRequest request) {
        JewelryItem transferred = catalogService.transferToStore(
                id,
                request.targetStoreId(),
                request.targetLocationId(),
                request.performedBy(),
                request.transferSlipNumber(),
                request.notes()
        );
        return ResponseEntity.ok(JewelryItemSummaryDto.fromEntity(transferred));
    }
}
