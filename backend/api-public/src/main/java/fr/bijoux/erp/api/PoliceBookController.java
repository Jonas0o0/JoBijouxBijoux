package fr.bijoux.erp.api;

import fr.bijoux.erp.police.domain.model.PoliceBookEntry;
import fr.bijoux.erp.police.domain.service.PoliceBookService;
import fr.bijoux.erp.police.dto.PoliceBookCreateRequest;
import fr.bijoux.erp.police.dto.PoliceBookEntryDto;
import fr.bijoux.erp.police.dto.PoliceBookExitRequest;
import jakarta.validation.Valid;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.List;

@RestController
@RequestMapping("/api/v1/police-book")
public class PoliceBookController {

    private final PoliceBookService policeBookService;

    public PoliceBookController(PoliceBookService policeBookService) {
        this.policeBookService = policeBookService;
    }

    @GetMapping("/entries")
    public ResponseEntity<List<PoliceBookEntryDto>> getEntries(@RequestParam Long storeId) {
        List<PoliceBookEntryDto> list = policeBookService.getEntriesByStore(storeId).stream()
                .map(PoliceBookEntryDto::fromEntity)
                .toList();
        return ResponseEntity.ok(list);
    }

    @PostMapping("/entries")
    public ResponseEntity<PoliceBookEntryDto> createEntry(@Valid @RequestBody PoliceBookCreateRequest request) {
        PoliceBookEntry entry = policeBookService.recordEntry(
                request.storeId(),
                request.entryType(),
                request.itemDescription(),
                request.metalType(),
                request.fineness(),
                request.grossWeightGrams(),
                request.estimatedNetWeightGrams(),
                request.hallmarks(),
                request.sellerFullName(),
                request.sellerCniPassport(),
                request.sellerAddress(),
                request.purchasePriceCents(),
                request.entryDate()
        );
        return ResponseEntity.ok(PoliceBookEntryDto.fromEntity(entry));
    }

    @PostMapping("/entries/{id}/exit")
    public ResponseEntity<PoliceBookEntryDto> recordExit(@PathVariable Long id,
                                                         @Valid @RequestBody PoliceBookExitRequest request) {
        PoliceBookEntry updated = policeBookService.recordExit(
                id,
                request.exitDate(),
                request.ticketNumber(),
                request.exitReason(),
                request.exitPriceCents()
        );
        return ResponseEntity.ok(PoliceBookEntryDto.fromEntity(updated));
    }

    @GetMapping("/export")
    public ResponseEntity<byte[]> exportRequisition(
            @RequestParam Long storeId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant to) {
        byte[] csv = policeBookService.exportRequisitionCsv(storeId, from, to);
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"livre_de_police_magasin_" + storeId + ".csv\"")
                .contentType(MediaType.parseMediaType("text/csv; charset=UTF-8"))
                .body(csv);
    }
}
