package fr.bijoux.erp.police.domain.service;

import fr.bijoux.erp.core.audit.service.FiscalSealingEngine;
import fr.bijoux.erp.police.domain.factory.PoliceBookEntryFactory;
import fr.bijoux.erp.police.domain.model.PoliceBookEntry;
import fr.bijoux.erp.police.domain.model.PoliceEntryType;
import fr.bijoux.erp.police.domain.repository.PoliceBookRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.List;

@Service
public class PoliceBookService {

    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss")
            .withZone(ZoneId.of("Europe/Paris"));

    private final PoliceBookRepository policeBookRepository;
    private final PoliceBookEntryFactory entryFactory;

    public PoliceBookService(PoliceBookRepository policeBookRepository, PoliceBookEntryFactory entryFactory) {
        this.policeBookRepository = policeBookRepository;
        this.entryFactory = entryFactory;
    }

    @Transactional
    public PoliceBookEntry recordEntry(
            Long storeId,
            PoliceEntryType entryType,
            String itemDescription,
            String metalType,
            String fineness,
            BigDecimal grossWeightGrams,
            BigDecimal estimatedNetWeightGrams,
            String hallmarks,
            String sellerFullName,
            String sellerCniPassport,
            String sellerAddress,
            long purchasePriceCents,
            Instant entryDate
    ) {
        if (sellerCniPassport == null || sellerCniPassport.isBlank()) {
            throw new IllegalArgumentException("Le numéro de CNI ou passeport du vendeur est obligatoire (CGI art. 537/538)");
        }
        if (grossWeightGrams == null || grossWeightGrams.compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalArgumentException("Le poids brut doit être strictement positif");
        }

        long sequenceNumber = policeBookRepository.findMaxSequenceNumber(storeId) + 1L;
        String previousHash = policeBookRepository.findTopByStoreIdOrderBySequenceNumberDesc(storeId)
                .map(PoliceBookEntry::getCurrentHash)
                .orElse(FiscalSealingEngine.GENESIS_ROOT_HASH);

        PoliceBookEntry entry = entryFactory.createEntry(
                sequenceNumber,
                storeId,
                entryDate,
                entryType,
                itemDescription,
                metalType,
                fineness,
                grossWeightGrams,
                estimatedNetWeightGrams,
                hallmarks,
                sellerFullName,
                sellerCniPassport,
                sellerAddress,
                purchasePriceCents,
                previousHash
        );

        return policeBookRepository.save(entry);
    }

    @Transactional
    public PoliceBookEntry recordExit(Long entryId, Instant exitDate, String ticketNumber, String exitReason, Long exitPriceCents) {
        PoliceBookEntry entry = policeBookRepository.findById(entryId)
                .orElseThrow(() -> new IllegalArgumentException("Inscription Livre de Police introuvable id=" + entryId));

        if (entry.getExitDate() != null) {
            throw new IllegalStateException("Cet objet est déjà sorti du Livre de Police à la date : " + entry.getExitDate());
        }

        entry.setExitDate(exitDate != null ? exitDate : Instant.now());
        entry.setExitTicketNumber(ticketNumber);
        entry.setExitReason(exitReason != null ? exitReason : "VENTE_CLIENT");
        entry.setExitPriceCents(exitPriceCents);

        return policeBookRepository.save(entry);
    }

    @Transactional(readOnly = true)
    public List<PoliceBookEntry> getEntriesByStore(Long storeId) {
        return policeBookRepository.findByStoreIdOrderBySequenceNumberAsc(storeId);
    }

    @Transactional(readOnly = true)
    public List<PoliceBookEntry> getOpenEntriesByStore(Long storeId) {
        return policeBookRepository.findByExitTicketNumberIsNullAndStoreId(storeId);
    }

    /**
     * Génère l'export officiel conforme aux réquisitions judiciaires et douanières (DGDDI).
     * Format CSV délimité par des points-virgules avec encodage UTF-8 et en-têtes officiels.
     */
    @Transactional(readOnly = true)
    public byte[] exportRequisitionCsv(Long storeId, Instant from, Instant to) {
        List<PoliceBookEntry> entries;
        if (from != null && to != null) {
            entries = policeBookRepository.findByPeriod(storeId, from, to);
        } else {
            entries = policeBookRepository.findByStoreIdOrderBySequenceNumberAsc(storeId);
        }

        StringBuilder sb = new StringBuilder();
        // BOM UTF-8 pour Excel
        sb.append("\uFEFF");
        sb.append("Numéro d'Ordre;Date Entrée;Type;Description;Métal;Titre;Poids Brut (g);Poids Net Estimé (g);Poinçons;Vendeur;Pièce d'Identité;Adresse;Prix Achat (€);Date Sortie;Réf Sortie;Motif Sortie;Prix Vente (€);Hash Chaîné;Signature Cryptographique\n");

        for (PoliceBookEntry e : entries) {
            sb.append(e.getSequenceNumber()).append(";")
                    .append(DATE_FORMATTER.format(e.getEntryDate())).append(";")
                    .append(e.getEntryType().name()).append(";")
                    .append(escapeCsv(e.getItemDescription())).append(";")
                    .append(escapeCsv(e.getMetalType())).append(";")
                    .append(escapeCsv(e.getFineness())).append(";")
                    .append(e.getGrossWeightGrams().toPlainString()).append(";")
                    .append(e.getEstimatedNetWeightGrams() != null ? e.getEstimatedNetWeightGrams().toPlainString() : "").append(";")
                    .append(escapeCsv(e.getHallmarks() != null ? e.getHallmarks() : "")).append(";")
                    .append(escapeCsv(e.getSellerFullName())).append(";")
                    .append(escapeCsv(e.getSellerCniPassport())).append(";")
                    .append(escapeCsv(e.getSellerAddress() != null ? e.getSellerAddress() : "")).append(";")
                    .append(String.format("%.2f", e.getPurchasePriceCents() / 100.0)).append(";")
                    .append(e.getExitDate() != null ? DATE_FORMATTER.format(e.getExitDate()) : "").append(";")
                    .append(escapeCsv(e.getExitTicketNumber() != null ? e.getExitTicketNumber() : "")).append(";")
                    .append(escapeCsv(e.getExitReason() != null ? e.getExitReason() : "")).append(";")
                    .append(e.getExitPriceCents() != null ? String.format("%.2f", e.getExitPriceCents() / 100.0) : "").append(";")
                    .append(e.getCurrentHash()).append(";")
                    .append(e.getSignature()).append("\n");
        }

        return sb.toString().getBytes(StandardCharsets.UTF_8);
    }

    private String escapeCsv(String val) {
        if (val == null) return "";
        return "\"" + val.replace("\"", "\"\"") + "\"";
    }
}
