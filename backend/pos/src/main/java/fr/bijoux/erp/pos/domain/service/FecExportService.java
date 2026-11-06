package fr.bijoux.erp.pos.domain.service;

import fr.bijoux.erp.catalog.domain.model.VatRegime;
import fr.bijoux.erp.pos.domain.model.PaymentMethod;
import fr.bijoux.erp.pos.domain.model.PaymentTransaction;
import fr.bijoux.erp.pos.domain.model.PosItemType;
import fr.bijoux.erp.pos.domain.model.PosTicket;
import fr.bijoux.erp.pos.domain.model.PosTicketLine;
import fr.bijoux.erp.pos.domain.repository.PosTicketRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Locale;

/**
 * Service d'export du Fichier des Écritures Comptables (FEC) officiel
 * conforme aux exigences de l'article A.47 A-1 du Livre des Procédures Fiscales (DGFIP).
 *
 * 18 colonnes normalisées séparées par des tabulations :
 * JournalCode, JournalLib, EcritureNum, EcritureDate, CompteNum, CompteLib,
 * CompAuxNum, CompAuxLib, PieceRef, PieceDate, EcritureLib, Debit, Credit,
 * EcritureLet, DateLet, ValidDate, Montantdevise, Idevise.
 *
 * Comptes Plan Comptable Général Joaillerie :
 * - 707 : Ventes marchandises neuves
 * - 706 : Prestations SAV / façon
 * - 7072 : Ventes occasion sous régime de la marge art. 297 A CGI
 * - 44571 : TVA collectée
 * - 512 : Banque / CB
 * - 530 : Caisse espèces
 */
@Service
public class FecExportService {

    public static final String FEC_HEADER = String.join("\t",
            "JournalCode",
            "JournalLib",
            "EcritureNum",
            "EcritureDate",
            "CompteNum",
            "CompteLib",
            "CompAuxNum",
            "CompAuxLib",
            "PieceRef",
            "PieceDate",
            "EcritureLib",
            "Debit",
            "Credit",
            "EcritureLet",
            "DateLet",
            "ValidDate",
            "Montantdevise",
            "Idevise"
    );

    private static final DateTimeFormatter FEC_DATE_FORMATTER = DateTimeFormatter.ofPattern("yyyyMMdd");
    private static final ZoneId FISCAL_ZONE = ZoneId.of("Europe/Paris");

    private final PosTicketRepository ticketRepository;

    public FecExportService(PosTicketRepository ticketRepository) {
        this.ticketRepository = ticketRepository;
    }

    @Transactional(readOnly = true)
    public byte[] generateFecBytes(Long storeId, Instant startDate, Instant endDate) {
        return generateFec(storeId, startDate, endDate).getBytes(StandardCharsets.UTF_8);
    }

    @Transactional(readOnly = true)
    public byte[] generateFecBytes(Long storeId, LocalDate startDate, LocalDate endDate) {
        Instant start = startDate != null ? startDate.atStartOfDay(FISCAL_ZONE).toInstant() : null;
        Instant end = endDate != null ? endDate.plusDays(1).atStartOfDay(FISCAL_ZONE).toInstant().minusNanos(1) : null;
        return generateFecBytes(storeId, start, end);
    }

    @Transactional(readOnly = true)
    public String generateFec(Long storeId, Instant startDate, Instant endDate) {
        if (storeId == null) {
            throw new IllegalArgumentException("Le point de vente (storeId) est obligatoire pour l'export FEC");
        }

        List<PosTicket> tickets;
        if (startDate != null && endDate != null) {
            tickets = ticketRepository.findCompletedTicketsBetween(storeId, startDate, endDate);
        } else {
            tickets = ticketRepository.findCompletedTicketsByStore(storeId);
        }

        StringBuilder sb = new StringBuilder();
        sb.append(FEC_HEADER).append("\r\n");

        long ecritureSeq = 1L;

        for (PosTicket ticket : tickets) {
            String ecritureNum = String.valueOf(ecritureSeq++);
            String ecritureDate = FEC_DATE_FORMATTER.format(ticket.getCreatedAt().atZone(FISCAL_ZONE));
            String pieceRef = ticket.getTicketNumber();
            String pieceDate = ecritureDate;
            String validDate = ecritureDate;
            String compAuxNum = ticket.getCustomerId() != null ? "CLI" + ticket.getCustomerId() : "";
            String compAuxLib = ticket.getCustomerId() != null ? "Client #" + ticket.getCustomerId() : "";
            String journalCode = "VT";
            String journalLib = "Journal des Ventes Joaillerie";

            // 1. Débits : Règlements (Caisse 530, Banque/CB 512, Avoirs/Bons 411, Rachat or 467)
            if (ticket.getPayments() != null && !ticket.getPayments().isEmpty()) {
                for (PaymentTransaction payment : ticket.getPayments()) {
                    String compteNum;
                    String compteLib;

                    PaymentMethod method = payment.getPaymentMethod();
                    if (method == PaymentMethod.CASH) {
                        compteNum = "530";
                        compteLib = "Caisse espèces";
                    } else if (method == PaymentMethod.CARD) {
                        compteNum = "512";
                        compteLib = "Banque / CB";
                    } else if (method == PaymentMethod.VOUCHER) {
                        compteNum = "411";
                        compteLib = "Clients - Avoirs et bons d'achat";
                    } else if (method == PaymentMethod.GOLD_SCRAP) {
                        compteNum = "467";
                        compteLib = "Rachat métaux précieux compensation";
                    } else {
                        compteNum = "512";
                        compteLib = "Banque / Autres règlements";
                    }

                    String debit = formatAmount(payment.getAmountCents());
                    String credit = "0,00";
                    String ecritureLib = "Encaissement " + method.name() + " ticket " + pieceRef;

                    appendFecRow(sb, journalCode, journalLib, ecritureNum, ecritureDate,
                            compteNum, compteLib, compAuxNum, compAuxLib, pieceRef, pieceDate,
                            ecritureLib, debit, credit, validDate);
                }
            } else {
                // Fallback si pas de transactions détaillées : Débit global Caisse 530
                String debit = formatAmount(ticket.getTotalTtcCents());
                appendFecRow(sb, journalCode, journalLib, ecritureNum, ecritureDate,
                        "530", "Caisse espèces", compAuxNum, compAuxLib, pieceRef, pieceDate,
                        "Encaissement global ticket " + pieceRef, debit, "0,00", validDate);
            }

            // 2. Crédits : Lignes d'articles et TVA (707, 706, 7072, 44571)
            if (ticket.getLines() != null && !ticket.getLines().isEmpty()) {
                for (PosTicketLine line : ticket.getLines()) {
                    long totalTtc = line.getTotalTtcCents();
                    long vat = line.getVatAmountCents() != null ? line.getVatAmountCents() : 0L;
                    long ht = totalTtc - vat;

                    String compteNum;
                    String compteLib;

                    if (line.getVatRegime() == VatRegime.MARGE_OCCASION_ART_297A) {
                        // Vente occasion sous le régime de la marge art. 297 A CGI
                        compteNum = "7072";
                        compteLib = "Ventes occasion sous régime de la marge art. 297 A CGI";
                    } else if (line.getItemType() == PosItemType.REPAIR_SERVICE
                            || line.getItemType() == PosItemType.REPAIR_ORDER
                            || line.getItemType() == PosItemType.CUSTOM_ORDER) {
                        // Prestation atelier / SAV / réparation joaillière
                        compteNum = "706";
                        compteLib = "Prestations SAV / façon";
                    } else {
                        // Vente de marchandises neuves standard
                        compteNum = "707";
                        compteLib = "Ventes marchandises neuves";
                    }

                    // Ligne Produit HT au Crédit
                    appendFecRow(sb, journalCode, journalLib, ecritureNum, ecritureDate,
                            compteNum, compteLib, compAuxNum, compAuxLib, pieceRef, pieceDate,
                            cleanLabel(line.getDesignation()), "0,00", formatAmount(ht), validDate);

                    // Ligne TVA collectée au Crédit
                    if (vat > 0) {
                        appendFecRow(sb, journalCode, journalLib, ecritureNum, ecritureDate,
                                "44571", "TVA collectée", compAuxNum, compAuxLib, pieceRef, pieceDate,
                                "TVA collectée - " + cleanLabel(line.getDesignation()), "0,00", formatAmount(vat), validDate);
                    }
                }
            } else {
                // Fallback si pas de lignes détaillées : Produit global 707 + TVA 44571
                long ht = ticket.getTotalHtCents();
                long vat = ticket.getTotalVatCents();

                appendFecRow(sb, journalCode, journalLib, ecritureNum, ecritureDate,
                        "707", "Ventes marchandises neuves", compAuxNum, compAuxLib, pieceRef, pieceDate,
                        "Vente globale ticket " + pieceRef, "0,00", formatAmount(ht), validDate);

                if (vat > 0) {
                    appendFecRow(sb, journalCode, journalLib, ecritureNum, ecritureDate,
                            "44571", "TVA collectée", compAuxNum, compAuxLib, pieceRef, pieceDate,
                            "TVA collectée ticket " + pieceRef, "0,00", formatAmount(vat), validDate);
                }
            }
        }

        return sb.toString();
    }

    private void appendFecRow(StringBuilder sb,
                              String journalCode,
                              String journalLib,
                              String ecritureNum,
                              String ecritureDate,
                              String compteNum,
                              String compteLib,
                              String compAuxNum,
                              String compAuxLib,
                              String pieceRef,
                              String pieceDate,
                              String ecritureLib,
                              String debit,
                              String credit,
                              String validDate) {
        sb.append(journalCode).append("\t")
                .append(journalLib).append("\t")
                .append(ecritureNum).append("\t")
                .append(ecritureDate).append("\t")
                .append(compteNum).append("\t")
                .append(compteLib).append("\t")
                .append(compAuxNum != null ? compAuxNum : "").append("\t")
                .append(compAuxLib != null ? compAuxLib : "").append("\t")
                .append(pieceRef).append("\t")
                .append(pieceDate).append("\t")
                .append(ecritureLib).append("\t")
                .append(debit).append("\t")
                .append(credit).append("\t")
                .append("").append("\t") // EcritureLet
                .append("").append("\t") // DateLet
                .append(validDate).append("\t")
                .append("").append("\t") // Montantdevise
                .append("")             // Idevise
                .append("\r\n");
    }

    private String formatAmount(Long cents) {
        if (cents == null || cents == 0L) {
            return "0,00";
        }
        return String.format(Locale.FRANCE, "%.2f", cents / 100.0);
    }

    private String cleanLabel(String label) {
        if (label == null) {
            return "";
        }
        return label.replace("\t", " ").replace("\r", "").replace("\n", "").trim();
    }
}
