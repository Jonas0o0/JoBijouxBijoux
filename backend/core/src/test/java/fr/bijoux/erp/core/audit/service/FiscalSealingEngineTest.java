package fr.bijoux.erp.core.audit.service;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.nio.charset.StandardCharsets;
import java.time.Instant;

import static org.assertj.core.api.Assertions.*;

@DisplayName("Tests unitaires du moteur de scellement cryptographique FiscalSealingEngine (NF525)")
class FiscalSealingEngineTest {

    private FiscalSealingEngine sealingEngine;
    private byte[] secretKey;

    @BeforeEach
    void setUp() {
        sealingEngine = new FiscalSealingEngine();
        secretKey = "SECRET_KEY_FOR_TESTING_PURPOSES_128_BITS".getBytes(StandardCharsets.UTF_8);
    }

    @Test
    @DisplayName("Doit calculer un hash SHA-256 déterministe pour le premier enregistrement")
    void shouldComputeChainHashForGenesis() {
        Instant now = Instant.ofEpochMilli(1700000000000L);
        String recordData = "VENTE;TICKET-001;TOTAL=150.00EUR";

        String hash1 = sealingEngine.computeChainHash(null, recordData, now, 1L);
        String hash2 = sealingEngine.computeChainHash(FiscalSealingEngine.GENESIS_ROOT_HASH, recordData, now, 1L);

        assertThat(hash1).isNotEmpty();
        assertThat(hash1).hasSize(64); // Longueur SHA-256 Hex
        assertThat(hash1).isEqualTo(hash2);
    }

    @Test
    @DisplayName("Doit chaîner deux enregistrements consécutifs")
    void shouldChainConsecutiveRecords() {
        Instant t1 = Instant.ofEpochMilli(1700000000000L);
        Instant t2 = Instant.ofEpochMilli(1700000005000L);

        String record1 = "EVENT;LOGIN;admin";
        String hash1 = sealingEngine.computeChainHash(null, record1, t1, 1L);

        String record2 = "EVENT;SALE;1500EUR";
        String hash2 = sealingEngine.computeChainHash(hash1, record2, t2, 2L);

        assertThat(hash2).isNotEqualTo(hash1);
        assertThat(sealingEngine.verifyChain(hash1, record2, t2, 2L, hash2)).isTrue();
    }

    @Test
    @DisplayName("Doit détecter une altération de données dans la chaîne")
    void shouldDetectTamperingInChain() {
        Instant t1 = Instant.ofEpochMilli(1700000000000L);
        String originalRecord = "PAYMENT;AMOUNT=100EUR";
        String tamperedRecord = "PAYMENT;AMOUNT=10EUR"; // Tentative de fraude

        String hash = sealingEngine.computeChainHash(null, originalRecord, t1, 1L);

        // La vérification avec les données altérées doit échouer
        boolean valid = sealingEngine.verifyChain(null, tamperedRecord, t1, 1L, hash);
        assertThat(valid).isFalse();
    }

    @Test
    @DisplayName("Doit sceller et vérifier une signature HMAC-SHA256")
    void shouldSealAndVerifyHmacSignature() {
        String chainHash = "AABBCCDDEEFF00112233445566778899AABBCCDDEEFF00112233445566778899";

        String signature = sealingEngine.sealRecord(secretKey, chainHash);
        assertThat(signature).isNotEmpty();
        assertThat(signature).hasSize(64);

        boolean verified = sealingEngine.verifyRecord(secretKey, chainHash, signature);
        assertThat(verified).isTrue();

        // Signature invalide avec une mauvaise clé
        byte[] wrongKey = "ANOTHER_SECRET_KEY_FOR_TESTS_128_BITS".getBytes(StandardCharsets.UTF_8);
        assertThat(sealingEngine.verifyRecord(wrongKey, chainHash, signature)).isFalse();
    }
}
