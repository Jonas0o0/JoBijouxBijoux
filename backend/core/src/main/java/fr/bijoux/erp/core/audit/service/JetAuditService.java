package fr.bijoux.erp.core.audit.service;

import fr.bijoux.erp.core.audit.model.JetAuditLog;
import fr.bijoux.erp.core.audit.model.SecurityEventType;
import fr.bijoux.erp.core.audit.repository.JetAuditLogRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.List;
import java.util.Optional;

/**
 * Service gérant le Journal des Événements Techniques (JET) NF525.
 * Chaînage inaltérable SHA-256 et signature HMAC-SHA256.
 */
@Service
public class JetAuditService {

    private static final Logger log = LoggerFactory.getLogger(JetAuditService.class);

    private final JetAuditLogRepository jetAuditLogRepository;
    private final FiscalSealingEngine fiscalSealingEngine;
    private final byte[] sealingSecretKey;

    public JetAuditService(JetAuditLogRepository jetAuditLogRepository,
                           FiscalSealingEngine fiscalSealingEngine,
                           @Value("${erp.fiscal.sealing-secret:ERP_BIJOUX_DEFAULT_SEALING_KEY_2026_NF525}") String secretKey) {
        this.jetAuditLogRepository = jetAuditLogRepository;
        this.fiscalSealingEngine = fiscalSealingEngine;
        this.sealingSecretKey = secretKey.getBytes(StandardCharsets.UTF_8);
    }

    /**
     * Enregistre un événement de sécurité technique avec scellement cryptographique chaîné.
     */
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public synchronized JetAuditLog logEvent(SecurityEventType eventType,
                                             String principal,
                                             Long storeId,
                                             String ipAddress,
                                             String action,
                                             String resourceType,
                                             String resourceId,
                                             String details) {
        Instant now = Instant.now();

        Optional<JetAuditLog> lastLogOpt = jetAuditLogRepository.findTopByOrderBySequenceNumberDesc();
        long sequenceNumber = lastLogOpt.map(l -> l.getSequenceNumber() + 1L).orElse(1L);
        String previousHash = lastLogOpt.map(JetAuditLog::getCurrentHash).orElse(FiscalSealingEngine.GENESIS_ROOT_HASH);

        String recordData = String.format("%s;%s;%s;%s;%s;%s;%s",
                eventType.name(),
                principal != null ? principal : "ANONYMOUS",
                storeId != null ? storeId.toString() : "GLOBAL",
                ipAddress != null ? ipAddress : "0.0.0.0",
                action != null ? action : "",
                resourceType != null ? resourceType : "",
                resourceId != null ? resourceId : ""
        );

        String currentHash = fiscalSealingEngine.computeChainHash(previousHash, recordData, now, sequenceNumber);
        String signature = fiscalSealingEngine.sealRecord(sealingSecretKey, currentHash);

        JetAuditLog auditLog = new JetAuditLog(
                now,
                eventType,
                principal != null ? principal : "ANONYMOUS",
                storeId,
                ipAddress,
                action,
                resourceType,
                resourceId,
                details,
                sequenceNumber,
                previousHash,
                currentHash,
                signature
        );

        JetAuditLog saved = jetAuditLogRepository.save(auditLog);
        log.info("[JET-AUDIT] seq={} type={} principal={} action={} hash={}",
                sequenceNumber, eventType, principal, action, currentHash);
        return saved;
    }

    /**
     * Vérifie l'intégrité globale de la chaîne d'audit WORM.
     * @return true si tous les blocs sont intègres et correctement chaînés, false en cas de falsification.
     */
    @Transactional(readOnly = true)
    public boolean verifyAuditChainIntegrity() {
        List<JetAuditLog> logs = jetAuditLogRepository.findAll();
        if (logs.isEmpty()) {
            return true;
        }

        String expectedPreviousHash = FiscalSealingEngine.GENESIS_ROOT_HASH;

        for (JetAuditLog entry : logs) {
            // 1. Vérification du chaînage du hash précédent
            if (!entry.getPreviousHash().equalsIgnoreCase(expectedPreviousHash)) {
                log.error("[JET-AUDIT-CORRUPTION] Rupture de précédent à seq={}", entry.getSequenceNumber());
                return false;
            }

            // 2. Vérification de la signature HMAC
            boolean signatureValid = fiscalSealingEngine.verifyRecord(sealingSecretKey, entry.getCurrentHash(), entry.getSignature());
            if (!signatureValid) {
                log.error("[JET-AUDIT-CORRUPTION] Signature invalide à seq={}", entry.getSequenceNumber());
                return false;
            }

            // 3. Recalcul du hash courant
            String recordData = String.format("%s;%s;%s;%s;%s;%s;%s",
                    entry.getEventType().name(),
                    entry.getPrincipal(),
                    entry.getStoreId() != null ? entry.getStoreId().toString() : "GLOBAL",
                    entry.getIpAddress() != null ? entry.getIpAddress() : "0.0.0.0",
                    entry.getAction(),
                    entry.getResourceType() != null ? entry.getResourceType() : "",
                    entry.getResourceId() != null ? entry.getResourceId() : ""
            );

            boolean hashValid = fiscalSealingEngine.verifyChain(
                    entry.getPreviousHash(),
                    recordData,
                    entry.getTimestamp(),
                    entry.getSequenceNumber(),
                    entry.getCurrentHash()
            );

            if (!hashValid) {
                log.error("[JET-AUDIT-CORRUPTION] Hash de contenu recalculé non conforme à seq={}", entry.getSequenceNumber());
                return false;
            }

            expectedPreviousHash = entry.getCurrentHash();
        }

        return true;
    }
}
