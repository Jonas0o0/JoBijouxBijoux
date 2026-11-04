package fr.bijoux.erp.pos.domain.model;

import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "fiscal_closure")
public class FiscalClosure {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Enumerated(EnumType.STRING)
    @Column(name = "closure_type", nullable = false, length = 40)
    private FiscalClosureType closureType;

    @Column(name = "sequence_number", nullable = false)
    private Long sequenceNumber;

    @Column(name = "store_id", nullable = false)
    private Long storeId;

    @Column(name = "operator_username", nullable = false, length = 100)
    private String operatorUsername;

    @Column(name = "opening_date", nullable = false)
    private Instant openingDate;

    @Column(name = "closing_date", nullable = false)
    private Instant closingDate;

    @Column(name = "total_ttc_cents", nullable = false)
    private Long totalTtcCents;

    @Column(name = "total_ht_cents", nullable = false)
    private Long totalHtCents;

    @Column(name = "total_vat_cents", nullable = false)
    private Long totalVatCents;

    @Column(name = "vat_breakdown_json", nullable = false, columnDefinition = "TEXT")
    private String vatBreakdownJson;

    @Column(name = "payment_breakdown_json", nullable = false, columnDefinition = "TEXT")
    private String paymentBreakdownJson;

    @Column(name = "grand_total_cumulative_cents", nullable = false)
    private Long grandTotalCumulativeCents;

    @Column(name = "previous_hash", nullable = false, length = 64)
    private String previousHash;

    @Column(name = "current_hash", nullable = false, length = 64)
    private String currentHash;

    @Column(name = "signature", nullable = false, length = 128)
    private String signature;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt = Instant.now();

    public FiscalClosure() {
    }

    public FiscalClosure(FiscalClosureType closureType, Long sequenceNumber, Long storeId,
                         String operatorUsername, Instant openingDate, Instant closingDate,
                         Long totalTtcCents, Long totalHtCents, Long totalVatCents,
                         String vatBreakdownJson, String paymentBreakdownJson,
                         Long grandTotalCumulativeCents, String previousHash,
                         String currentHash, String signature) {
        this.closureType = closureType;
        this.sequenceNumber = sequenceNumber;
        this.storeId = storeId;
        this.operatorUsername = operatorUsername;
        this.openingDate = openingDate;
        this.closingDate = closingDate;
        this.totalTtcCents = totalTtcCents;
        this.totalHtCents = totalHtCents;
        this.totalVatCents = totalVatCents;
        this.vatBreakdownJson = vatBreakdownJson;
        this.paymentBreakdownJson = paymentBreakdownJson;
        this.grandTotalCumulativeCents = grandTotalCumulativeCents;
        this.previousHash = previousHash;
        this.currentHash = currentHash;
        this.signature = signature;
        this.createdAt = Instant.now();
    }

    // Getters and setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public FiscalClosureType getClosureType() { return closureType; }
    public void setClosureType(FiscalClosureType closureType) { this.closureType = closureType; }

    public Long getSequenceNumber() { return sequenceNumber; }
    public void setSequenceNumber(Long sequenceNumber) { this.sequenceNumber = sequenceNumber; }

    public Long getStoreId() { return storeId; }
    public void setStoreId(Long storeId) { this.storeId = storeId; }

    public String getOperatorUsername() { return operatorUsername; }
    public void setOperatorUsername(String operatorUsername) { this.operatorUsername = operatorUsername; }

    public Instant getOpeningDate() { return openingDate; }
    public void setOpeningDate(Instant openingDate) { this.openingDate = openingDate; }

    public Instant getClosingDate() { return closingDate; }
    public void setClosingDate(Instant closingDate) { this.closingDate = closingDate; }

    public Long getTotalTtcCents() { return totalTtcCents; }
    public void setTotalTtcCents(Long totalTtcCents) { this.totalTtcCents = totalTtcCents; }

    public Long getTotalHtCents() { return totalHtCents; }
    public void setTotalHtCents(Long totalHtCents) { this.totalHtCents = totalHtCents; }

    public Long getTotalVatCents() { return totalVatCents; }
    public void setTotalVatCents(Long totalVatCents) { this.totalVatCents = totalVatCents; }

    public String getVatBreakdownJson() { return vatBreakdownJson; }
    public void setVatBreakdownJson(String vatBreakdownJson) { this.vatBreakdownJson = vatBreakdownJson; }

    public String getPaymentBreakdownJson() { return paymentBreakdownJson; }
    public void setPaymentBreakdownJson(String paymentBreakdownJson) { this.paymentBreakdownJson = paymentBreakdownJson; }

    public Long getGrandTotalCumulativeCents() { return grandTotalCumulativeCents; }
    public void setGrandTotalCumulativeCents(Long grandTotalCumulativeCents) { this.grandTotalCumulativeCents = grandTotalCumulativeCents; }

    public String getPreviousHash() { return previousHash; }
    public void setPreviousHash(String previousHash) { this.previousHash = previousHash; }

    public String getCurrentHash() { return currentHash; }
    public void setCurrentHash(String currentHash) { this.currentHash = currentHash; }

    public String getSignature() { return signature; }
    public void setSignature(String signature) { this.signature = signature; }

    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
}
