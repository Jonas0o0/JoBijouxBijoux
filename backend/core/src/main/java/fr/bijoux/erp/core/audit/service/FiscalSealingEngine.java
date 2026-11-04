package fr.bijoux.erp.core.audit.service;

import org.bouncycastle.util.encoders.Hex;
import org.springframework.stereotype.Component;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.Instant;
import java.util.Objects;

/**
 * Moteur cryptographique de scellement et de chaînage inaltérable (NF525 & CGI art. 537/538).
 * Assure l'intégrité absolue du Journal des Événements Techniques (JET),
 * des écritures de caisse et du Livre de Police.
 */
@Component
public class FiscalSealingEngine {

    public static final String GENESIS_ROOT_HASH = "0000000000000000000000000000000000000000000000000000000000000000";
    private static final String SHA256_ALGORITHM = "SHA-256";
    private static final String HMAC_SHA256_ALGORITHM = "HmacSHA256";

    /**
     * Calcule le hash cryptographique SHA-256 chaîné pour un enregistrement.
     * Payload canonique : previousHash|sequenceNumber|timestampMillis|recordData
     *
     * @param previousHash   Hash du bloc précédent (ou GENESIS_ROOT_HASH si 1er bloc)
     * @param recordData     Données métier sérialisées de façon canonique
     * @param timestamp      Date/heure de création
     * @param sequenceNumber Numéro d'ordre séquentiel strictement monotone sans trou
     * @return Digest SHA-256 en chaîne hexadécimale majuscule
     */
    public String computeChainHash(String previousHash, String recordData, Instant timestamp, long sequenceNumber) {
        String effectivePreviousHash = (previousHash == null || previousHash.isBlank() || sequenceNumber <= 1L)
                ? GENESIS_ROOT_HASH
                : previousHash.trim();

        Objects.requireNonNull(recordData, "Les données de l'enregistrement ne peuvent pas être nulles");
        Objects.requireNonNull(timestamp, "L'horodatage ne peut pas être null");
        if (sequenceNumber < 1L) {
            throw new IllegalArgumentException("Le numéro de séquence doit être supérieur ou égal à 1 : " + sequenceNumber);
        }

        String canonicalPayload = String.join("|",
                effectivePreviousHash,
                String.valueOf(sequenceNumber),
                String.valueOf(timestamp.toEpochMilli()),
                recordData.trim()
        );

        try {
            MessageDigest digest = MessageDigest.getInstance(SHA256_ALGORITHM);
            byte[] hashBytes = digest.digest(canonicalPayload.getBytes(StandardCharsets.UTF_8));
            return Hex.toHexString(hashBytes).toUpperCase();
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException("Algorithme SHA-256 non disponible dans la JVM", e);
        }
    }

    /**
     * Scelle un hash chaîné avec une clé secrète via HMAC-SHA256 (Signature fiscale).
     *
     * @param secretKey Clé secrète de scellement
     * @param chainHash Hash d'enregistrement à sceller
     * @return Signature hexadécimale majuscule
     */
    public String sealRecord(byte[] secretKey, String chainHash) {
        Objects.requireNonNull(secretKey, "La clé de scellement ne peut pas être null");
        Objects.requireNonNull(chainHash, "Le hash à sceller ne peut pas être null");

        if (secretKey.length < 16) {
            throw new IllegalArgumentException("La clé secrète de scellement doit faire au moins 128 bits (16 octets)");
        }

        try {
            Mac mac = Mac.getInstance(HMAC_SHA256_ALGORITHM);
            SecretKeySpec keySpec = new SecretKeySpec(secretKey, HMAC_SHA256_ALGORITHM);
            mac.init(keySpec);
            byte[] signatureBytes = mac.doFinal(chainHash.getBytes(StandardCharsets.UTF_8));
            return Hex.toHexString(signatureBytes).toUpperCase();
        } catch (Exception e) {
            throw new IllegalStateException("Erreur lors de la signature cryptographique HMAC-SHA256", e);
        }
    }

    /**
     * Vérifie la conformité de la signature cryptographique d'un scellement.
     */
    public boolean verifyRecord(byte[] secretKey, String chainHash, String expectedSignature) {
        if (expectedSignature == null || expectedSignature.isBlank()) {
            return false;
        }
        String computedSignature = sealRecord(secretKey, chainHash);
        return computedSignature.equalsIgnoreCase(expectedSignature.trim());
    }

    /**
     * Vérifie la validité du chaînage SHA-256 d'un enregistrement par rapport à son parent.
     */
    public boolean verifyChain(String previousHash, String recordData, Instant timestamp, long sequenceNumber, String currentHash) {
        if (currentHash == null || currentHash.isBlank()) {
            return false;
        }
        String recalculated = computeChainHash(previousHash, recordData, timestamp, sequenceNumber);
        return recalculated.equalsIgnoreCase(currentHash.trim());
    }
}
