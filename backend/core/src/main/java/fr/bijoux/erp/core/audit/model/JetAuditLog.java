package fr.bijoux.erp.core.audit.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.Instant;

/**
 * Journal des Événements Techniques (JET) - NF525.
 * Table inaltérable WORM (Write Once Read Many) avec chaînage SHA-256 et scellement HMAC-SHA256.
 */
@Entity
@Table(name = "jet_audit_log", indexes = {
        @Index(name = "idx_jet_seq", columnList = "sequence_number", unique = true),
        @Index(name = "idx_jet_timestamp", columnList = "timestamp"),
        @Index(name = "idx_jet_principal", columnList = "principal")
})
public class JetAuditLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotNull
    @Column(name = "timestamp", nullable = false, updatable = false)
    private Instant timestamp = Instant.now();

    @NotNull
    @Enumerated(EnumType.STRING)
    @Column(name = "event_type", nullable = false, length = 50, updatable = false)
    private SecurityEventType eventType;

    @NotBlank
    @Size(max = 100)
    @Column(name = "principal", nullable = false, length = 100, updatable = false)
    private String principal;

    @Column(name = "store_id", updatable = false)
    private Long storeId;

    @Size(max = 50)
    @Column(name = "ip_address", length = 50, updatable = false)
    private String ipAddress;

    @NotBlank
    @Size(max = 100)
    @Column(name = "action", nullable = false, length = 100, updatable = false)
    private String action;

    @Size(max = 80)
    @Column(name = "resource_type", length = 80, updatable = false)
    private String resourceType;

    @Size(max = 80)
    @Column(name = "resource_id", length = 80, updatable = false)
    private String resourceId;

    @Column(name = "details", columnDefinition = "TEXT", updatable = false)
    private String details;

    @Column(name = "sequence_number", nullable = false, unique = true, updatable = false)
    private long sequenceNumber;

    @NotBlank
    @Column(name = "previous_hash", nullable = false, length = 64, updatable = false)
    private String previousHash;

    @NotBlank
    @Column(name = "current_hash", nullable = false, length = 64, updatable = false)
    private String currentHash;

    @NotBlank
    @Column(name = "signature", nullable = false, length = 128, updatable = false)
    private String signature;

    public JetAuditLog() {
    }

    public JetAuditLog(Instant timestamp,
                       SecurityEventType eventType,
                       String principal,
                       Long storeId,
                       String ipAddress,
                       String action,
                       String resourceType,
                       String resourceId,
                       String details,
                       long sequenceNumber,
                       String previousHash,
                       String currentHash,
                       String signature) {
        this.timestamp = timestamp;
        this.eventType = eventType;
        this.principal = principal;
        this.storeId = storeId;
        this.ipAddress = ipAddress;
        this.action = action;
        this.resourceType = resourceType;
        this.resourceId = resourceId;
        this.details = details;
        this.sequenceNumber = sequenceNumber;
        this.previousHash = previousHash;
        this.currentHash = currentHash;
        this.signature = signature;
    }

    public Long getId() {
        return id;
    }

    public Instant getTimestamp() {
        return timestamp;
    }

    public SecurityEventType getEventType() {
        return eventType;
    }

    public String getPrincipal() {
        return principal;
    }

    public Long getStoreId() {
        return storeId;
    }

    public String getIpAddress() {
        return ipAddress;
    }

    public String getAction() {
        return action;
    }

    public String getResourceType() {
        return resourceType;
    }

    public String getResourceId() {
        return resourceId;
    }

    public String getDetails() {
        return details;
    }

    public long getSequenceNumber() {
        return sequenceNumber;
    }

    public String getPreviousHash() {
        return previousHash;
    }

    public String getCurrentHash() {
        return currentHash;
    }

    public String getSignature() {
        return signature;
    }
}
