package fr.bijoux.erp.pos.domain.service;

import fr.bijoux.erp.catalog.domain.model.VatRegime;
import fr.bijoux.erp.pos.domain.model.*;
import fr.bijoux.erp.pos.domain.repository.PosTicketRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@DisplayName("Tests Unitaires - Export FEC (Fichier des Écritures Comptables conforme DGFIP)")
class FecExportServiceTest {

    @Mock
    private PosTicketRepository ticketRepository;

    private FecExportService fecExportService;

    @BeforeEach
    void setUp() {
        fecExportService = new FecExportService(ticketRepository);
    }

    @Test
    @DisplayName("FEC : Doit comporter exactement les 18 colonnes normalisées de l'art. A.47 A-1 du LPF")
    void shouldGenerateCompliantFecHeaderAndColumns() {
        when(ticketRepository.findCompletedTicketsByStore(1L)).thenReturn(List.of());

        String fec = fecExportService.generateFec(1L, null, null);

        String[] lines = fec.split("\r\n");
        assertThat(lines).isNotEmpty();

        String header = lines[0];
        String[] cols = header.split("\t", -1);
        assertThat(cols).hasSize(18);
        assertThat(cols).containsExactly(
                "JournalCode", "JournalLib", "EcritureNum", "EcritureDate",
                "CompteNum", "CompteLib", "CompAuxNum", "CompAuxLib",
                "PieceRef", "PieceDate", "EcritureLib", "Debit", "Credit",
                "EcritureLet", "DateLet", "ValidDate", "Montantdevise", "Idevise"
        );
    }

    @Test
    @DisplayName("FEC : Doit imputer ventes neuves (707), SAV (706), occasion marge (7072), TVA (44571), CB (512) et Caisse (530)")
    void shouldMapAccountsAccuratelyAccordingToPcgJoaillerie() {
        Instant now = Instant.parse("2026-11-06T14:30:00Z");

        // Ticket 1 : Vente marchandise neuve 120€ TTC (100€ HT + 20€ TVA) payée par CB (512)
        PosTicket t1 = new PosTicket("TKT-1-000001", 1L, "vendeur1", 42L, 10_000L, 2_000L, 12_000L, "hPrev", "hCurr1", "sig1");
        t1.setCreatedAt(now);
        t1.addLine(new PosTicketLine(1, PosItemType.CATALOG_ITEM, 10L, "Bague Or 750", 1, 12_000L, 12_000L, new BigDecimal("20.00"), VatRegime.STANDARD_20, 2_000L));
        t1.addPayment(new PaymentTransaction(PaymentMethod.CARD, 12_000L, "TX_CB_1", "AUTH1", null, null));

        // Ticket 2 : Prestation SAV réparation 60€ TTC (50€ HT + 10€ TVA) payée en espèces (530)
        PosTicket t2 = new PosTicket("TKT-1-000002", 1L, "vendeur1", 43L, 5_000L, 1_000L, 6_000L, "hCurr1", "hCurr2", "sig2");
        t2.setCreatedAt(now);
        t2.addLine(new PosTicketLine(1, PosItemType.REPAIR_SERVICE, null, 5L, "Mise à taille bague or", 1, 6_000L, 6_000L, new BigDecimal("20.00"), VatRegime.STANDARD_20, 1_000L));
        t2.addPayment(new PaymentTransaction(PaymentMethod.CASH, 6_000L, "TX_CASH_2", null, null, null));

        // Ticket 3 : Vente occasion régime de la marge 240€ TTC (200€ base marge + 40€ TVA marge)
        PosTicket t3 = new PosTicket("TKT-1-000003", 1L, "vendeur1", 44L, 20_000L, 4_000L, 24_000L, "hCurr2", "hCurr3", "sig3");
        t3.setCreatedAt(now);
        t3.addLine(new PosTicketLine(1, PosItemType.CATALOG_ITEM, 15L, "Montre Vintage Occasion", 1, 24_000L, 24_000L, new BigDecimal("20.00"), VatRegime.MARGE_OCCASION_ART_297A, 4_000L));
        t3.addPayment(new PaymentTransaction(PaymentMethod.CARD, 24_000L, "TX_CB_3", "AUTH3", null, null));

        when(ticketRepository.findCompletedTicketsByStore(1L)).thenReturn(List.of(t1, t2, t3));

        String fec = fecExportService.generateFec(1L, null, null);
        String[] lines = fec.split("\r\n");

        assertThat(lines.length).isGreaterThan(1);

        // Vérifier que chaque ligne a strictement 18 colonnes
        for (int i = 1; i < lines.length; i++) {
            String[] cols = lines[i].split("\t", -1);
            assertThat(cols)
                    .as("Ligne %d doit avoir exactement 18 colonnes", i)
                    .hasSize(18);
        }

        // Vérification de la présence des comptes cibles
        assertThat(fec).contains("707\tVentes marchandises neuves");
        assertThat(fec).contains("706\tPrestations SAV / façon");
        assertThat(fec).contains("7072\tVentes occasion sous régime de la marge art. 297 A CGI");
        assertThat(fec).contains("44571\tTVA collectée");
        assertThat(fec).contains("512\tBanque / CB");
        assertThat(fec).contains("530\tCaisse espèces");

        // Vérification de l'équilibre comptable en partie double (Total Débit == Total Crédit)
        double totalDebit = 0.0;
        double totalCredit = 0.0;
        for (int i = 1; i < lines.length; i++) {
            String[] cols = lines[i].split("\t", -1);
            double debit = Double.parseDouble(cols[11].replace(",", "."));
            double credit = Double.parseDouble(cols[12].replace(",", "."));
            totalDebit += debit;
            totalCredit += credit;
        }

        // Total Débit : 120 + 60 + 240 = 420.00 €
        assertThat(totalDebit).isEqualTo(420.00);
        // Total Crédit : (100+20) + (50+10) + (200+40) = 420.00 €
        assertThat(totalCredit).isEqualTo(420.00);
        assertThat(totalDebit).isEqualTo(totalCredit);
    }
}
