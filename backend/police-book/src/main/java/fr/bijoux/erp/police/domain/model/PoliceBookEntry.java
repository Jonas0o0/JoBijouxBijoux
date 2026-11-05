package fr.bijoux.erp.police.domain.model;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.Instant;

@Entity
@Table(name = "police_book_entry")
public class PoliceBookEntry {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "sequence_number", nullable = false, unique = true)
    private Long sequenceNumber;

    @Column(name = "store_id", nullable = false)
    private Long storeId;

    @Column(name = "entry_date", nullable = false)
    private Instant entryDate = Instant.now();

    @Enumerated(EnumType.STRING)
    @Column(name = "entry_type", nullable = false, length = 40)
    private PoliceEntryType entryType;

    @Column(name = "item_description", nullable = false, length = 500)
    private String itemDescription;

    @Column(name = "metal_type", nullable = false, length = 40)
    private String metalType;

    @Column(name = "fineness", nullable = false, length = 40)
    private String fineness;

    @Column(name = "gross_weight_grams", nullable = false, precision = 10, scale = 3)
    private BigDecimal grossWeightGrams;

    @Column(name = "estimated_net_weight_grams", precision = 10, scale = 3)
    private BigDecimal estimatedNetWeightGrams;

    @Column(name = "hallmarks", length = 100)
    private String hallmarks;

    @Column(name = "seller_full_name", nullable = false, length = 150)
    private String sellerFullName;

    @Column(name = "seller_cni_passport", nullable = false, length = 100)
    private String sellerCniPassport;

    @Column(name = "seller_address", length = 255)
    private String sellerAddress;

    @Column(name = "purchase_price_cents", nullable = false)
    private Long purchasePriceCents;

    @Column(name = "exit_date")
    private Instant exitDate;

    @Column(name = "exit_ticket_number", length = 60)
    private String exitTicketNumber;

    @Column(name = "exit_reason", length = 100)
    private String exitReason;

    @Column(name = "exit_price_cents")
    private Long exitPriceCents;

    @Column(name = "previous_hash", nullable = false, length = 64)
    private String previousHash;

    @Column(name = "current_hash", nullable = false, length = 64)
    private String currentHash;

    @Column(name = "signature", nullable = false, length = 128)
    private String signature;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt = Instant.now();

    public PoliceBookEntry() {
    }

    public PoliceBookEntry(Long sequenceNumber, Long storeId, Instant entryDate,
                           PoliceEntryType entryType, String itemDescription,
                           String metalType, String fineness, BigDecimal grossWeightGrams,
                           BigDecimal estimatedNetWeightGrams, String hallmarks,
                           String sellerFullName, String sellerCniPassport, String sellerAddress,
                           Long purchasePriceCents, String previousHash, String currentHash, String signature) {
        this.sequenceNumber = sequenceNumber;
        this.storeId = storeId;
        this.entryDate = entryDate != null ? entryDate : Instant.now();
        this.entryType = entryType;
        this.itemDescription = itemDescription;
        this.metalType = metalType;
        this.fineness = fineness;
        this.grossWeightGrams = grossWeightGrams;
        this.estimatedNetWeightGrams = estimatedNetWeightGrams;
        this.hallmarks = hallmarks;
        this.sellerFullName = sellerFullName;
        this.sellerCniPassport = sellerCniPassport;
        this.sellerAddress = sellerAddress;
        this.purchasePriceCents = purchasePriceCents;
        this.previousHash = previousHash;
        this.currentHash = currentHash;
        this.signature = signature;
        this.createdAt = Instant.now();
    }

    // Getters and setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getSequenceNumber() { return sequenceNumber; }
    public void setSequenceNumber(Long sequenceNumber) { this.sequenceNumber = sequenceNumber; }

    public Long getStoreId() { return storeId; }
    public void setStoreId(Long storeId) { this.storeId = storeId; }

    public Instant getEntryDate() { return entryDate; }
    public void setEntryDate(Instant entryDate) { this.entryDate = entryDate; }

    public PoliceEntryType getEntryType() { return entryType; }
    public void setEntryType(PoliceEntryType entryType) { this.entryType = entryType; }

    public String getItemDescription() { return itemDescription; }
    public void setItemDescription(String itemDescription) { this.itemDescription = itemDescription; }

    public String getMetalType() { return metalType; }
    public void setMetalType(String metalType) { this.metalType = metalType; }

    public String getFineness() { return fineness; }
    public void setFineness(String fineness) { this.fineness = fineness; }

    public BigDecimal getGrossWeightGrams() { return grossWeightGrams; }
    public void setGrossWeightGrams(BigDecimal grossWeightGrams) { this.grossWeightGrams = grossWeightGrams; }

    public BigDecimal getEstimatedNetWeightGrams() { return estimatedNetWeightGrams; }
    public void setEstimatedNetWeightGrams(BigDecimal estimatedNetWeightGrams) { this.estimatedNetWeightGrams = estimatedNetWeightGrams; }

    public String getHallmarks() { return hallmarks; }
    public void setHallmarks(String hallmarks) { this.hallmarks = hallmarks; }

    public String getSellerFullName() { return sellerFullName; }
    public void setSellerFullName(String sellerFullName) { this.sellerFullName = sellerFullName; }

    public String getSellerCniPassport() { return sellerCniPassport; }
    public void setSellerCniPassport(String sellerCniPassport) { this.sellerCniPassport = sellerCniPassport; }

    public String getSellerAddress() { return sellerAddress; }
    public void setSellerAddress(String sellerAddress) { this.sellerAddress = sellerAddress; }

    public Long getPurchasePriceCents() { return purchasePriceCents; }
    public void setPurchasePriceCents(Long purchasePriceCents) { this.purchasePriceCents = purchasePriceCents; }

    public Instant getExitDate() { return exitDate; }
    public void setExitDate(Instant exitDate) { this.exitDate = exitDate; }

    public String getExitTicketNumber() { return exitTicketNumber; }
    public void setExitTicketNumber(String exitTicketNumber) { this.exitTicketNumber = exitTicketNumber; }

    public String getExitReason() { return exitReason; }
    public void setExitReason(String exitReason) { this.exitReason = exitReason; }

    public Long getExitPriceCents() { return exitPriceCents; }
    public void setExitPriceCents(Long exitPriceCents) { this.exitPriceCents = exitPriceCents; }

    public String getPreviousHash() { return previousHash; }
    public void setPreviousHash(String previousHash) { this.previousHash = previousHash; }

    public String getCurrentHash() { return currentHash; }
    public void setCurrentHash(String currentHash) { this.currentHash = currentHash; }

    public String getSignature() { return signature; }
    public void setSignature(String signature) { this.signature = signature; }

    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
}
