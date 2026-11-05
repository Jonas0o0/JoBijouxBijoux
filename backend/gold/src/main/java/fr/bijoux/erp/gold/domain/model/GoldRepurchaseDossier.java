package fr.bijoux.erp.gold.domain.model;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "gold_repurchase_dossier")
public class GoldRepurchaseDossier {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "dossier_number", nullable = false, unique = true, length = 60)
    private String dossierNumber;

    @Column(name = "store_id", nullable = false)
    private Long storeId;

    @Column(name = "operator_username", nullable = false, length = 100)
    private String operatorUsername;

    @Column(name = "customer_id")
    private Long customerId;

    @Column(name = "seller_full_name", nullable = false, length = 150)
    private String sellerFullName;

    @Column(name = "seller_cni_passport", nullable = false, length = 100)
    private String sellerCniPassport;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 40)
    private GoldRepurchaseStatus status = GoldRepurchaseStatus.DRAFT;

    @Enumerated(EnumType.STRING)
    @Column(name = "payment_method", nullable = false, length = 40)
    private GoldPaymentMethod paymentMethod = GoldPaymentMethod.VIREMENT;

    @Column(name = "total_gross_weight_grams", nullable = false, precision = 10, scale = 3)
    private BigDecimal totalGrossWeightGrams = BigDecimal.ZERO;

    @Column(name = "total_estimated_net_weight_grams", nullable = false, precision = 10, scale = 3)
    private BigDecimal totalEstimatedNetWeightGrams = BigDecimal.ZERO;

    @Column(name = "total_gross_amount_cents", nullable = false)
    private Long totalGrossAmountCents = 0L;

    @Enumerated(EnumType.STRING)
    @Column(name = "tax_strategy", nullable = false, length = 40)
    private GoldTaxRegime taxStrategy = GoldTaxRegime.TMP_11_5;

    @Column(name = "tax_amount_cents", nullable = false)
    private Long taxAmountCents = 0L;

    @Column(name = "net_payable_to_seller_cents", nullable = false)
    private Long netPayableToSellerCents = 0L;

    @Column(name = "signed_at")
    private Instant signedAt;

    @Column(name = "cooling_off_ends_at")
    private Instant coolingOffEndsAt;

    @Column(name = "finalized_at")
    private Instant finalizedAt;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt = Instant.now();

    @OneToMany(mappedBy = "dossier", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    private List<GoldScrapItem> items = new ArrayList<>();

    public GoldRepurchaseDossier() {
    }

    public GoldRepurchaseDossier(String dossierNumber, Long storeId, String operatorUsername,
                                Long customerId, String sellerFullName, String sellerCniPassport,
                                GoldTaxRegime taxStrategy, GoldPaymentMethod paymentMethod) {
        this.dossierNumber = dossierNumber;
        this.storeId = storeId;
        this.operatorUsername = operatorUsername;
        this.customerId = customerId;
        this.sellerFullName = sellerFullName;
        this.sellerCniPassport = sellerCniPassport;
        this.taxStrategy = taxStrategy != null ? taxStrategy : GoldTaxRegime.TMP_11_5;
        this.paymentMethod = paymentMethod != null ? paymentMethod : GoldPaymentMethod.VIREMENT;
        this.status = GoldRepurchaseStatus.DRAFT;
        this.createdAt = Instant.now();
    }

    public void addItem(GoldScrapItem item) {
        this.items.add(item);
        item.setDossier(this);
    }

    // Getters and setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getDossierNumber() { return dossierNumber; }
    public void setDossierNumber(String dossierNumber) { this.dossierNumber = dossierNumber; }

    public Long getStoreId() { return storeId; }
    public void setStoreId(Long storeId) { this.storeId = storeId; }

    public String getOperatorUsername() { return operatorUsername; }
    public void setOperatorUsername(String operatorUsername) { this.operatorUsername = operatorUsername; }

    public Long getCustomerId() { return customerId; }
    public void setCustomerId(Long customerId) { this.customerId = customerId; }

    public String getSellerFullName() { return sellerFullName; }
    public void setSellerFullName(String sellerFullName) { this.sellerFullName = sellerFullName; }

    public String getSellerCniPassport() { return sellerCniPassport; }
    public void setSellerCniPassport(String sellerCniPassport) { this.sellerCniPassport = sellerCniPassport; }

    public GoldRepurchaseStatus getStatus() { return status; }
    public void setStatus(GoldRepurchaseStatus status) { this.status = status; }

    public GoldPaymentMethod getPaymentMethod() { return paymentMethod; }
    public void setPaymentMethod(GoldPaymentMethod paymentMethod) { this.paymentMethod = paymentMethod; }

    public BigDecimal getTotalGrossWeightGrams() { return totalGrossWeightGrams; }
    public void setTotalGrossWeightGrams(BigDecimal totalGrossWeightGrams) { this.totalGrossWeightGrams = totalGrossWeightGrams; }

    public BigDecimal getTotalEstimatedNetWeightGrams() { return totalEstimatedNetWeightGrams; }
    public void setTotalEstimatedNetWeightGrams(BigDecimal totalEstimatedNetWeightGrams) { this.totalEstimatedNetWeightGrams = totalEstimatedNetWeightGrams; }

    public Long getTotalGrossAmountCents() { return totalGrossAmountCents; }
    public void setTotalGrossAmountCents(Long totalGrossAmountCents) { this.totalGrossAmountCents = totalGrossAmountCents; }

    public GoldTaxRegime getTaxStrategy() { return taxStrategy; }
    public void setTaxStrategy(GoldTaxRegime taxStrategy) { this.taxStrategy = taxStrategy; }

    public Long getTaxAmountCents() { return taxAmountCents; }
    public void setTaxAmountCents(Long taxAmountCents) { this.taxAmountCents = taxAmountCents; }

    public Long getNetPayableToSellerCents() { return netPayableToSellerCents; }
    public void setNetPayableToSellerCents(Long netPayableToSellerCents) { this.netPayableToSellerCents = netPayableToSellerCents; }

    public Instant getSignedAt() { return signedAt; }
    public void setSignedAt(Instant signedAt) { this.signedAt = signedAt; }

    public Instant getCoolingOffEndsAt() { return coolingOffEndsAt; }
    public void setCoolingOffEndsAt(Instant coolingOffEndsAt) { this.coolingOffEndsAt = coolingOffEndsAt; }

    public Instant getFinalizedAt() { return finalizedAt; }
    public void setFinalizedAt(Instant finalizedAt) { this.finalizedAt = finalizedAt; }

    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }

    public List<GoldScrapItem> getItems() { return items; }
    public void setItems(List<GoldScrapItem> items) { this.items = items; }
}
