package fr.bijoux.erp.gold.domain.model;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.Instant;

@Entity
@Table(name = "casting_batch")
public class CastingBatch {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "batch_number", nullable = false, unique = true, length = 60)
    private String batchNumber;

    @Column(name = "store_id", nullable = false)
    private Long storeId;

    @Column(name = "operator_username", nullable = false, length = 100)
    private String operatorUsername;

    @Column(name = "status", nullable = false, length = 40)
    private String status = "PREPARATION";

    @Column(name = "total_gross_weight_grams", nullable = false, precision = 10, scale = 3)
    private BigDecimal totalGrossWeightGrams = BigDecimal.ZERO;

    @Column(name = "total_fine_gold_grams", nullable = false, precision = 10, scale = 3)
    private BigDecimal totalFineGoldGrams = BigDecimal.ZERO;

    @Column(name = "foundry_name", length = 120)
    private String foundryName;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt = Instant.now();

    @Column(name = "closed_at")
    private Instant closedAt;

    public CastingBatch() {
    }

    public CastingBatch(String batchNumber, Long storeId, String operatorUsername,
                        BigDecimal totalGrossWeightGrams, BigDecimal totalFineGoldGrams, String foundryName) {
        this.batchNumber = batchNumber;
        this.storeId = storeId;
        this.operatorUsername = operatorUsername;
        this.totalGrossWeightGrams = totalGrossWeightGrams;
        this.totalFineGoldGrams = totalFineGoldGrams;
        this.foundryName = foundryName;
        this.status = "PREPARATION";
        this.createdAt = Instant.now();
    }

    // Getters and setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getBatchNumber() { return batchNumber; }
    public void setBatchNumber(String batchNumber) { this.batchNumber = batchNumber; }

    public Long getStoreId() { return storeId; }
    public void setStoreId(Long storeId) { this.storeId = storeId; }

    public String getOperatorUsername() { return operatorUsername; }
    public void setOperatorUsername(String operatorUsername) { this.operatorUsername = operatorUsername; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public BigDecimal getTotalGrossWeightGrams() { return totalGrossWeightGrams; }
    public void setTotalGrossWeightGrams(BigDecimal totalGrossWeightGrams) { this.totalGrossWeightGrams = totalGrossWeightGrams; }

    public BigDecimal getTotalFineGoldGrams() { return totalFineGoldGrams; }
    public void setTotalFineGoldGrams(BigDecimal totalFineGoldGrams) { this.totalFineGoldGrams = totalFineGoldGrams; }

    public String getFoundryName() { return foundryName; }
    public void setFoundryName(String foundryName) { this.foundryName = foundryName; }

    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }

    public Instant getClosedAt() { return closedAt; }
    public void setClosedAt(Instant closedAt) { this.closedAt = closedAt; }
}
