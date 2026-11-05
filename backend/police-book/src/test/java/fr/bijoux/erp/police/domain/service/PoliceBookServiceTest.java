package fr.bijoux.erp.police.domain.service;

import fr.bijoux.erp.core.audit.service.FiscalSealingEngine;
import fr.bijoux.erp.police.domain.factory.PoliceBookEntryFactory;
import fr.bijoux.erp.police.domain.model.PoliceBookEntry;
import fr.bijoux.erp.police.domain.model.PoliceEntryType;
import fr.bijoux.erp.police.domain.repository.PoliceBookRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("Tests Unitaires - Livre de Police Inaltérable (CGI art. 537/538)")
class PoliceBookServiceTest {

    @Mock
    private PoliceBookRepository policeBookRepository;

    private PoliceBookService policeBookService;

    @BeforeEach
    void setUp() {
        FiscalSealingEngine sealingEngine = new FiscalSealingEngine();
        PoliceBookEntryFactory factory = new PoliceBookEntryFactory(sealingEngine);
        ReflectionTestUtils.setField(factory, "sealingSecret", "TEST_KEY_POLICE_BOOK_128_BITS");

        policeBookService = new PoliceBookService(policeBookRepository, factory);
    }

    @Test
    @DisplayName("Doit créer une inscription avec numéro d'ordre gapless, hash chaîné et signature")
    void shouldRecordEntrySuccessfully() {
        when(policeBookRepository.findMaxSequenceNumber(1L)).thenReturn(0L);
        when(policeBookRepository.findTopByStoreIdOrderBySequenceNumberDesc(1L)).thenReturn(Optional.empty());
        when(policeBookRepository.save(any(PoliceBookEntry.class))).thenAnswer(inv -> inv.getArgument(0));

        PoliceBookEntry entry = policeBookService.recordEntry(
                1L,
                PoliceEntryType.ACHAT_PARTICULIER,
                "Bague solitaire diamant 0.50 ct",
                "GOLD",
                "750‰",
                new BigDecimal("4.500"),
                new BigDecimal("4.400"),
                "Tête d'aigle",
                "Jean Dupont",
                "CNI-123456789",
                "10 rue de la Paix, 75002 Paris",
                45_000L,
                Instant.now()
        );

        assertThat(entry).isNotNull();
        assertThat(entry.getSequenceNumber()).isEqualTo(1L);
        assertThat(entry.getSellerCniPassport()).isEqualTo("CNI-123456789");
        assertThat(entry.getPreviousHash()).isEqualTo(FiscalSealingEngine.GENESIS_ROOT_HASH);
        assertThat(entry.getCurrentHash()).isNotBlank();
        assertThat(entry.getSignature()).isNotBlank();

        verify(policeBookRepository, times(1)).save(any(PoliceBookEntry.class));
    }

    @Test
    @DisplayName("Doit interdire une entrée sans pièce d'identité (CNI / Passeport)")
    void shouldRejectEntryWithoutCni() {
        assertThatThrownBy(() -> policeBookService.recordEntry(
                1L,
                PoliceEntryType.ACHAT_PARTICULIER,
                "Bague or",
                "GOLD",
                "750‰",
                new BigDecimal("5.000"),
                null,
                null,
                "Anonyme",
                "",
                null,
                20_000L,
                Instant.now()
        )).isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("CNI ou passeport du vendeur est obligatoire");
    }

    @Test
    @DisplayName("Doit enregistrer la sortie d'un objet et interdire une double sortie")
    void shouldRecordExitAndPreventDoubleExit() {
        PoliceBookEntry entry = new PoliceBookEntry(
                1L, 1L, Instant.now(), PoliceEntryType.ACHAT_PARTICULIER, "Montre or", "GOLD", "750‰",
                new BigDecimal("45.000"), new BigDecimal("40.000"), "Poinçon officiel",
                "Alice Martin", "CNI-98765", "Lyon", 100_000L,
                "PREV_HASH", "CURR_HASH", "SIG"
        );
        entry.setId(10L);

        when(policeBookRepository.findById(10L)).thenReturn(Optional.of(entry));
        when(policeBookRepository.save(any(PoliceBookEntry.class))).thenAnswer(inv -> inv.getArgument(0));

        PoliceBookEntry updated = policeBookService.recordExit(10L, Instant.now(), "TKT-1-000045", "VENTE_CLIENT", 150_000L);

        assertThat(updated.getExitTicketNumber()).isEqualTo("TKT-1-000045");
        assertThat(updated.getExitPriceCents()).isEqualTo(150_000L);
        assertThat(updated.getExitDate()).isNotNull();

        // Tentative de re-sortir le même objet
        assertThatThrownBy(() -> policeBookService.recordExit(10L, Instant.now(), "TKT-1-000046", "VENTE_CLIENT", 150_000L))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("déjà sorti du Livre de Police");
    }

    @Test
    @DisplayName("Doit exporter le Livre de Police au format CSV conforme aux réquisitions Douanes")
    void shouldExportRequisitionCsv() {
        PoliceBookEntry entry = new PoliceBookEntry(
                1L, 1L, Instant.parse("2026-05-10T10:00:00Z"), PoliceEntryType.ACHAT_PARTICULIER, "Bague Or 750", "GOLD", "750‰",
                new BigDecimal("5.200"), new BigDecimal("5.000"), "Tête d'aigle",
                "Pierre Durand", "PASS-778899", "Marseille", 30_000L,
                "PREV_HASH", "CURR_HASH", "SIG"
        );
        entry.setExitDate(Instant.parse("2026-05-15T15:30:00Z"));
        entry.setExitTicketNumber("TKT-1-000100");
        entry.setExitReason("VENTE_BOUTIQUE");
        entry.setExitPriceCents(60_000L);

        when(policeBookRepository.findByStoreIdOrderBySequenceNumberAsc(1L)).thenReturn(List.of(entry));

        byte[] csvBytes = policeBookService.exportRequisitionCsv(1L, null, null);
        String csvContent = new String(csvBytes, StandardCharsets.UTF_8);

        assertThat(csvContent).contains("Numéro d'Ordre;Date Entrée;Type;Description");
        assertThat(csvContent).contains("Pierre Durand");
        assertThat(csvContent).contains("PASS-778899");
        assertThat(csvContent).contains("TKT-1-000100");
        assertThat(csvContent).contains("300,00"); // 300,00 €
        assertThat(csvContent).contains("600,00"); // 600,00 €
    }
}
