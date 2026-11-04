package fr.bijoux.erp.catalog.domain.model;

import fr.bijoux.erp.core.domain.valueobject.GoldFineness;
import fr.bijoux.erp.core.domain.valueobject.MoneyAmount;
import fr.bijoux.erp.core.domain.valueobject.WeightInGrams;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.Objects;

/**
 * Pièce de bijouterie ou joaillerie sérialisée unique.
 * Clé d'identification du Livre de Police, du stock unitaire et du suivi fiscal.
 */
@Entity
@Table(name = "jewelry_item", indexes = {
        @Index(name = "idx_jewelry_serial", columnList = "serial_number", unique = true),
        @Index(name = "idx_jewelry_ref", columnList = "reference_number"),
        @Index(name = "idx_jewelry_store_status", columnList = "store_id, status"),
        @Index(name = "idx_jewelry_location", columnList = "storage_location_id")
})
public class JewelryItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank
    @Size(max = 60)
    @Column(name = "serial_number", nullable = false, unique = true, length = 60)
    private String serialNumber;

    @Size(max = 60)
    @Column(name = "reference_number", length = 60)
    private String referenceNumber;

    @NotBlank
    @Size(max = 255)
    @Column(name = "designation", nullable = false, length = 255)
    private String designation;

    @NotNull
    @Enumerated(EnumType.STRING)
    @Column(name = "fineness", nullable = false, length = 40)
    private GoldFineness fineness;

    @NotNull
    @PositiveOrZero
    @Column(name = "gross_weight_grams", precision = 10, scale = 3, nullable = false)
    private BigDecimal grossWeightGrams;

    @PositiveOrZero
    @Column(name = "estimated_net_weight_grams", precision = 10, scale = 3)
    private BigDecimal estimatedNetWeightGrams;

    @Size(max = 80)
    @Column(name = "master_hallmark", length = 80)
    private String masterHallmark;

    @Size(max = 80)
    @Column(name = "state_hallmark", length = 80)
    private String stateHallmark;

    @NotNull
    @Column(name = "selling_price_ttc_cents", nullable = false)
    private long sellingPriceTtcCents;

    @NotNull
    @Column(name = "purchase_price_ht_cents", nullable = false)
    private long purchasePriceHtCents;

    @NotNull
    @Enumerated(EnumType.STRING)
    @Column(name = "tax_regime", nullable = false, length = 50)
    private VatRegime taxRegime = VatRegime.STANDARD_20;

    @NotNull
    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 40)
    private JewelryItemStatus status = JewelryItemStatus.EN_STOCK;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "storage_location_id")
    private StorageLocation storageLocation;

    @NotNull
    @Column(name = "store_id", nullable = false)
    private Long storeId;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    @Column(name = "updated_at")
    private Instant updatedAt;

    public JewelryItem() {
    }

    public JewelryItem(String serialNumber,
                       String referenceNumber,
                       String designation,
                       GoldFineness fineness,
                       WeightInGrams grossWeight,
                       MoneyAmount sellingPriceTtc,
                       MoneyAmount purchasePriceHt,
                       VatRegime taxRegime,
                       Long storeId) {
        this.serialNumber = serialNumber;
        this.referenceNumber = referenceNumber;
        this.designation = designation;
        this.fineness = fineness;
        this.grossWeightGrams = grossWeight.value();
        this.estimatedNetWeightGrams = grossWeight.value();
        this.sellingPriceTtcCents = sellingPriceTtc.cents();
        this.purchasePriceHtCents = purchasePriceHt.cents();
        this.taxRegime = taxRegime != null ? taxRegime : VatRegime.STANDARD_20;
        this.storeId = storeId;
        this.status = JewelryItemStatus.EN_STOCK;
        this.createdAt = Instant.now();
    }

    /**
     * Calcule le poids de métal fin pur de ce bijou.
     */
    public WeightInGrams calculateFineWeight() {
        return fineness.calculateFineWeight(getGrossWeight());
    }

    public WeightInGrams getGrossWeight() {
        return WeightInGrams.of(this.grossWeightGrams);
    }

    public void setGrossWeight(WeightInGrams grossWeight) {
        this.grossWeightGrams = grossWeight.value();
    }

    public WeightInGrams getEstimatedNetWeight() {
        return this.estimatedNetWeightGrams != null ? WeightInGrams.of(this.estimatedNetWeightGrams) : getGrossWeight();
    }

    public void setEstimatedNetWeight(WeightInGrams netWeight) {
        this.estimatedNetWeightGrams = netWeight != null ? netWeight.value() : null;
    }

    public MoneyAmount getSellingPriceTtc() {
        return MoneyAmount.ofCents(this.sellingPriceTtcCents);
    }

    public void setSellingPriceTtc(MoneyAmount price) {
        this.sellingPriceTtcCents = price.cents();
    }

    public MoneyAmount getPurchasePriceHt() {
        return MoneyAmount.ofCents(this.purchasePriceHtCents);
    }

    public void setPurchasePriceHt(MoneyAmount price) {
        this.purchasePriceHtCents = price.cents();
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getSerialNumber() {
        return serialNumber;
    }

    public void setSerialNumber(String serialNumber) {
        this.serialNumber = serialNumber;
    }

    public String getReferenceNumber() {
        return referenceNumber;
    }

    public void setReferenceNumber(String referenceNumber) {
        this.referenceNumber = referenceNumber;
    }

    public String getDesignation() {
        return designation;
    }

    public void setDesignation(String designation) {
        this.designation = designation;
    }

    public GoldFineness getFineness() {
        return fineness;
    }

    public void setFineness(GoldFineness fineness) {
        this.fineness = fineness;
    }

    public BigDecimal getGrossWeightGrams() {
        return grossWeightGrams;
    }

    public void setGrossWeightGrams(BigDecimal grossWeightGrams) {
        this.grossWeightGrams = grossWeightGrams;
    }

    public BigDecimal getEstimatedNetWeightGrams() {
        return estimatedNetWeightGrams;
    }

    public void setEstimatedNetWeightGrams(BigDecimal estimatedNetWeightGrams) {
        this.estimatedNetWeightGrams = estimatedNetWeightGrams;
    }

    public String getMasterHallmark() {
        return masterHallmark;
    }

    public void setMasterHallmark(String masterHallmark) {
        this.masterHallmark = masterHallmark;
    }

    public String getStateHallmark() {
        return stateHallmark;
    }

    public void setStateHallmark(String stateHallmark) {
        this.stateHallmark = stateHallmark;
    }

    public long getSellingPriceTtcCents() {
        return sellingPriceTtcCents;
    }

    public void setSellingPriceTtcCents(long sellingPriceTtcCents) {
        this.sellingPriceTtcCents = sellingPriceTtcCents;
    }

    public long getPurchasePriceHtCents() {
        return purchasePriceHtCents;
    }

    public void setPurchasePriceHtCents(long purchasePriceHtCents) {
        this.purchasePriceHtCents = purchasePriceHtCents;
    }

    public VatRegime getTaxRegime() {
        return taxRegime;
    }

    public void setTaxRegime(VatRegime taxRegime) {
        this.taxRegime = taxRegime;
    }

    public JewelryItemStatus getStatus() {
        return status;
    }

    public void setStatus(JewelryItemStatus status) {
        this.status = status;
    }

    public StorageLocation getStorageLocation() {
        return storageLocation;
    }

    public void setStorageLocation(StorageLocation storageLocation) {
        this.storageLocation = storageLocation;
    }

    public Long getStoreId() {
        return storeId;
    }

    public void setStoreId(Long storeId) {
        this.storeId = storeId;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(Instant updatedAt) {
        this.updatedAt = updatedAt;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof JewelryItem that)) return false;
        return Objects.equals(serialNumber, that.serialNumber);
    }

    @Override
    public int hashCode() {
        return Objects.hash(serialNumber);
    }
}
