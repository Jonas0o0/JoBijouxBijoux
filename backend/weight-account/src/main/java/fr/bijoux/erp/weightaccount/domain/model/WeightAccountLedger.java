package fr.bijoux.erp.weightaccount.domain.model;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.Instant;

@Entity
@Table(name = "weight_account_ledger")
public class WeightAccountLedger {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "store_id", nullable = false)
    private Long storeId;

    @Column(name = "partner_name", nullable = false, length = 120)
    private String partnerName;

    @Column(name = "partner_type", nullable = false, length = 40)
    private String partnerType;

    @Column(name = "metal_type", nullable = false, length = 40)
    private String metalType = "GOLD";

    @Enumerated(EnumType.STRING)
    @Column(name = "movement_type", nullable = false, length = 40)
    private WeightMovementType movementType;

    @Column(name = "weight_fine_gold_grams", nullable = false, precision = 10, scale = 3)
    private BigDecimal weightFineGoldGrams;

    @Column(name = "balance_after_grams", nullable = false, precision = 10, scale = 3)
    private BigDecimal balanceAfterGrams;

    @Column(name = "reference_document", length = 100)
    private String referenceDocument;

    @Column(name = "timestamp", nullable = false)
    private Instant timestamp = Instant.now();

    @Column(name = "notes", columnDefinition = "TEXT")
    private String notes;

    public WeightAccountLedger() {
    }

    public WeightAccountLedger(Long storeId, String partnerName, String partnerType,
                               String metalType, WeightMovementType movementType,
                               BigDecimal weightFineGoldGrams, BigDecimal balanceAfterGrams,
                               String referenceDocument, String notes) {
        this.storeId = storeId;
        this.partnerName = partnerName;
        this.partnerType = partnerType;
        this.metalType = metalType != null ? metalType : "GOLD";
        this.movementType = movementType;
        this.weightFineGoldGrams = weightFineGoldGrams;
        this.balanceAfterGrams = balanceAfterGrams;
        this.referenceDocument = referenceDocument;
        this.notes = notes;
        this.timestamp = Instant.now();
    }

    // Getters and setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getStoreId() { return storeId; }
    public void setStoreId(Long storeId) { this.storeId = storeId; }

    public String getPartnerName() { return partnerName; }
    public void setPartnerName(String partnerName) { this.partnerName = partnerName; }

    public String getPartnerType() { return partnerType; }
    public void setPartnerType(String partnerType) { this.partnerType = partnerType; }

    public String getMetalType() { return metalType; }
    public void setMetalType(String metalType) { this.metalType = metalType; }

    public WeightMovementType getMovementType() { return movementType; }
    public void setMovementType(WeightMovementType movementType) { this.movementType = movementType; }

    public BigDecimal getWeightFineGoldGrams() { return weightFineGoldGrams; }
    public void setWeightFineGoldGrams(BigDecimal weightFineGoldGrams) { this.weightFineGoldGrams = weightFineGoldGrams; }

    public BigDecimal getBalanceAfterGrams() { return balanceAfterGrams; }
    public void setBalanceAfterGrams(BigDecimal balanceAfterGrams) { this.balanceAfterGrams = balanceAfterGrams; }

    public String getReferenceDocument() { return referenceDocument; }
    public void setReferenceDocument(String referenceDocument) { this.referenceDocument = referenceDocument; }

    public Instant getTimestamp() { return timestamp; }
    public void setTimestamp(Instant timestamp) { this.timestamp = timestamp; }

    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }
}
