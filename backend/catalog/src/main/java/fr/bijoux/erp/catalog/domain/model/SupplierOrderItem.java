package fr.bijoux.erp.catalog.domain.model;

import fr.bijoux.erp.core.domain.valueobject.GoldFineness;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;

/**
 * Ligne d'une commande d'achat fournisseur en joaillerie.
 */
@Entity
@Table(name = "supplier_order_item", indexes = {
        @Index(name = "idx_sup_item_order", columnList = "supplier_order_id")
})
public class SupplierOrderItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "supplier_order_id", nullable = false)
    private SupplierOrder supplierOrder;

    @Size(max = 60)
    @Column(name = "reference_number", length = 60)
    private String referenceNumber;

    @NotBlank
    @Size(max = 255)
    @Column(name = "designation", nullable = false, length = 255)
    private String designation;

    @Positive
    @Column(name = "quantity", nullable = false)
    private int quantity = 1;

    @Column(name = "received_quantity", nullable = false)
    private int receivedQuantity = 0;

    @NotNull
    @Column(name = "unit_purchase_price_ht_cents", nullable = false)
    private Long unitPurchasePriceHtCents;

    @Column(name = "total_purchase_price_ht_cents", nullable = false)
    private Long totalPurchasePriceHtCents;

    @Enumerated(EnumType.STRING)
    @Column(name = "fineness", length = 40)
    private GoldFineness fineness = GoldFineness.OR_750;

    @Column(name = "gross_weight_grams", precision = 10, scale = 3)
    private BigDecimal grossWeightGrams;

    @Column(name = "selling_price_ttc_cents")
    private Long sellingPriceTtcCents;

    @Enumerated(EnumType.STRING)
    @Column(name = "vat_regime", length = 50)
    private VatRegime vatRegime = VatRegime.STANDARD_20;

    public SupplierOrderItem() {
    }

    public SupplierOrderItem(String referenceNumber,
                             String designation,
                             int quantity,
                             Long unitPurchasePriceHtCents,
                             GoldFineness fineness,
                             BigDecimal grossWeightGrams,
                             Long sellingPriceTtcCents,
                             VatRegime vatRegime) {
        this.referenceNumber = referenceNumber;
        this.designation = designation;
        this.quantity = quantity;
        this.receivedQuantity = 0;
        this.unitPurchasePriceHtCents = unitPurchasePriceHtCents;
        this.totalPurchasePriceHtCents = unitPurchasePriceHtCents != null ? unitPurchasePriceHtCents * quantity : 0L;
        this.fineness = fineness != null ? fineness : GoldFineness.OR_750;
        this.grossWeightGrams = grossWeightGrams != null ? grossWeightGrams : new BigDecimal("3.500");
        this.sellingPriceTtcCents = sellingPriceTtcCents != null ? sellingPriceTtcCents : (unitPurchasePriceHtCents != null ? unitPurchasePriceHtCents * 2L : 0L);
        this.vatRegime = vatRegime != null ? vatRegime : VatRegime.STANDARD_20;
    }

    // Getters and setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public SupplierOrder getSupplierOrder() {
        return supplierOrder;
    }

    public void setSupplierOrder(SupplierOrder supplierOrder) {
        this.supplierOrder = supplierOrder;
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

    public int getQuantity() {
        return quantity;
    }

    public void setQuantity(int quantity) {
        this.quantity = quantity;
        if (this.unitPurchasePriceHtCents != null) {
            this.totalPurchasePriceHtCents = this.unitPurchasePriceHtCents * quantity;
        }
    }

    public int getReceivedQuantity() {
        return receivedQuantity;
    }

    public void setReceivedQuantity(int receivedQuantity) {
        this.receivedQuantity = receivedQuantity;
    }

    public Long getUnitPurchasePriceHtCents() {
        return unitPurchasePriceHtCents;
    }

    public void setUnitPurchasePriceHtCents(Long unitPurchasePriceHtCents) {
        this.unitPurchasePriceHtCents = unitPurchasePriceHtCents;
        if (unitPurchasePriceHtCents != null) {
            this.totalPurchasePriceHtCents = unitPurchasePriceHtCents * this.quantity;
        }
    }

    public Long getTotalPurchasePriceHtCents() {
        return totalPurchasePriceHtCents;
    }

    public void setTotalPurchasePriceHtCents(Long totalPurchasePriceHtCents) {
        this.totalPurchasePriceHtCents = totalPurchasePriceHtCents;
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

    public Long getSellingPriceTtcCents() {
        return sellingPriceTtcCents;
    }

    public void setSellingPriceTtcCents(Long sellingPriceTtcCents) {
        this.sellingPriceTtcCents = sellingPriceTtcCents;
    }

    public VatRegime getVatRegime() {
        return vatRegime;
    }

    public void setVatRegime(VatRegime vatRegime) {
        this.vatRegime = vatRegime;
    }
}
