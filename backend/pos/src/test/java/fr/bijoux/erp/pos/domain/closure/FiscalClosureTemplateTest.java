package fr.bijoux.erp.pos.domain.closure;

import com.fasterxml.jackson.databind.ObjectMapper;
import fr.bijoux.erp.core.audit.service.FiscalSealingEngine;
import fr.bijoux.erp.pos.domain.model.*;
import fr.bijoux.erp.pos.domain.repository.FiscalClosureRepository;
import fr.bijoux.erp.pos.domain.repository.PosTicketRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("Tests Unitaires - Template Method Clôtures Fiscales NF525")
class FiscalClosureTemplateTest {

    @Mock
    private PosTicketRepository ticketRepository;

    @Mock
    private FiscalClosureRepository closureRepository;

    private DailyZClosureProcessor dailyZProcessor;
    private InterimXClosureProcessor interimXProcessor;

    @BeforeEach
    void setUp() {
        FiscalSealingEngine sealingEngine = new FiscalSealingEngine();
        ObjectMapper objectMapper = new ObjectMapper();

        dailyZProcessor = new DailyZClosureProcessor(ticketRepository, closureRepository, sealingEngine, objectMapper);
        ReflectionTestUtils.setField(dailyZProcessor, "sealingSecret", "TEST_FISCAL_KEY_FOR_CLOSURES_128_BITS");

        interimXProcessor = new InterimXClosureProcessor(ticketRepository, closureRepository, sealingEngine, objectMapper);
        ReflectionTestUtils.setField(interimXProcessor, "sealingSecret", "TEST_FISCAL_KEY_FOR_CLOSURES_128_BITS");
    }

    @Test
    @DisplayName("Doit exécuter une clôture Ticket Z, agréger les totaux et sceller avec grand total cumulatif")
    void shouldExecuteDailyZClosure() {
        PosTicket ticket1 = new PosTicket("TKT-1-001", 1L, "op1", null, 10_000L, 2_000L, 12_000L, "PREV1", "CURR1", "SIG1");
        PosTicket ticket2 = new PosTicket("TKT-1-002", 1L, "op1", null, 20_000L, 4_000L, 24_000L, "CURR1", "CURR2", "SIG2");

        when(ticketRepository.findCompletedTicketsBetween(eq(1L), any(Instant.class), any(Instant.class)))
                .thenReturn(List.of(ticket1, ticket2));
        when(closureRepository.findTopByStoreIdOrderByCreatedAtDescIdDesc(1L)).thenReturn(Optional.empty());
        when(closureRepository.findMaxSequenceNumber(1L, FiscalClosureType.JOURNALIER_Z)).thenReturn(5L);
        when(closureRepository.save(any(FiscalClosure.class))).thenAnswer(inv -> inv.getArgument(0));

        ClosureContext ctx = new ClosureContext(1L, "directeur", FiscalClosureType.JOURNALIER_Z, null, null);
        FiscalClosure closure = dailyZProcessor.executeClosure(ctx);

        assertThat(closure.getClosureType()).isEqualTo(FiscalClosureType.JOURNALIER_Z);
        assertThat(closure.getSequenceNumber()).isEqualTo(6L); // 5 + 1
        assertThat(closure.getTotalTtcCents()).isEqualTo(36_000L); // 12_000 + 24_000
        assertThat(closure.getGrandTotalCumulativeCents()).isEqualTo(36_000L);
        assertThat(closure.getSignature()).isNotBlank();

        verify(closureRepository, times(1)).save(any(FiscalClosure.class));
    }

    @Test
    @DisplayName("Le Ticket X doit agréger sans sauvegarder en base ni consommer de séquence fiscale")
    void shouldExecuteInterimXWithoutPersisting() {
        PosTicket ticket = new PosTicket("TKT-1-001", 1L, "op1", null, 10_000L, 2_000L, 12_000L, "PREV1", "CURR1", "SIG1");

        when(ticketRepository.findCompletedTicketsBetween(eq(1L), any(Instant.class), any(Instant.class)))
                .thenReturn(List.of(ticket));

        ClosureContext ctx = new ClosureContext(1L, "op1", FiscalClosureType.INTERIM_X, null, null);
        FiscalClosure closure = interimXProcessor.executeClosure(ctx);

        assertThat(closure.getClosureType()).isEqualTo(FiscalClosureType.INTERIM_X);
        assertThat(closure.getSequenceNumber()).isEqualTo(0L);
        assertThat(closure.getTotalTtcCents()).isEqualTo(12_000L);

        verify(closureRepository, never()).save(any());
    }
}
