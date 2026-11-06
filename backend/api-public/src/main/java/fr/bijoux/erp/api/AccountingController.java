package fr.bijoux.erp.api;

import fr.bijoux.erp.pos.domain.service.FecExportService;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;

@RestController
@RequestMapping("/api/v1/accounting")
public class AccountingController {

    private final FecExportService fecExportService;

    public AccountingController(FecExportService fecExportService) {
        this.fecExportService = fecExportService;
    }

    @GetMapping("/fec")
    public ResponseEntity<byte[]> exportFec(
            @RequestParam Long storeId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {

        byte[] fecContent = fecExportService.generateFecBytes(storeId, startDate, endDate);

        String dateStr = (startDate != null ? startDate.format(DateTimeFormatter.ofPattern("yyyyMMdd")) : "ALL")
                + "_" + (endDate != null ? endDate.format(DateTimeFormatter.ofPattern("yyyyMMdd")) : "ALL");
        String filename = String.format("FEC_MAG%d_%s.txt", storeId, dateStr);

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"")
                .contentType(MediaType.parseMediaType("text/plain; charset=UTF-8"))
                .body(fecContent);
    }
}
