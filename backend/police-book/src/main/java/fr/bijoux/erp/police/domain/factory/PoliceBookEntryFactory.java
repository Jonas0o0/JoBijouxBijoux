package fr.bijoux.erp.police.domain.factory;

import fr.bijoux.erp.core.audit.service.FiscalSealingEngine;
import fr.bijoux.erp.police.domain.model.PoliceBookEntry;
import fr.bijoux.erp.police.domain.model.PoliceEntryType;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.time.Instant;

/**
 * Factory Pattern pour la création certifiée et inaltérable des inscriptions au Livre de Police (CGI art. 537/538).
 */
@Component
public class PoliceBookEntryFactory {

    private final FiscalSealingEngine sealingEngine;

    @Value("${erp.fiscal.sealing-secret:TESTING_FISCAL_SEALING_KEY_NF525}")
    private String sealingSecret;

    public PoliceBookEntryFactory(FiscalSealingEngine sealingEngine) {
        this.sealingEngine = sealingEngine;
    }

    public PoliceBookEntry createEntry(
            long sequenceNumber,
            Long storeId,
            Instant entryDate,
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
            String previousHash
    ) {
        Instant effectiveDate = (entryDate != null) ? entryDate : Instant.now();
        String effectivePrevHash = (previousHash != null && !previousHash.isBlank()) ? previousHash : FiscalSealingEngine.GENESIS_ROOT_HASH;

        String canonicalPayload = String.format("POLICE|%d|%d|%s|%s|%s|%s|%s|%s|%d",
                sequenceNumber,
                storeId,
                entryType.name(),
                itemDescription.trim(),
                metalType.trim(),
                fineness.trim(),
                grossWeightGrams.toPlainString(),
                sellerCniPassport.trim(),
                purchasePriceCents
        );

        String currentHash = sealingEngine.computeChainHash(effectivePrevHash, canonicalPayload, effectiveDate, sequenceNumber);
        String signature = sealingEngine.sealRecord(sealingSecret, currentHash);

        return new PoliceBookEntry(
                sequenceNumber,
                storeId,
                effectiveDate,
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
                effectivePrevHash,
                currentHash,
                signature
        );
    }
}
