package fr.bijoux.erp.catalog.domain.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

/**
 * Commande d'achat fournisseur pour réassort de bijoux et métaux précieux.
 */
@Entity
@Table(name = "supplier_order", indexes = {
        @Index(name = "idx_sup_order_num", columnList = "order_number", unique = true),
        @Index(name = "idx_sup_order_store", columnList = "store_id"),
        @Index(name = "idx_sup_order_status", columnList = "status")
})
public class SupplierOrder {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank
    @Size(max = 60)
    @Column(name = "order_number", nullable = false, unique = true, length = 60)
    private String orderNumber;

    @NotNull
    @Column(name = "store_id", nullable = false)
    private Long storeId;

    @NotBlank
    @Size(max = 150)
    @Column(name = "supplier_name", nullable = false, length = 150)
    private String supplierName;

    @NotNull
    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 40)
    private SupplierOrderStatus status = SupplierOrderStatus.COMMANDE;

    @Column(name = "destination_stock", length = 50)
    private String destinationStock;

    @Column(name = "total_amount_ht_cents", nullable = false)
    private Long totalAmountHtCents = 0L;

    @Column(name = "total_vat_cents", nullable = false)
    private Long totalVatCents = 0L;

    @Column(name = "total_amount_ttc_cents", nullable = false)
    private Long totalAmountTtcCents = 0L;

    @Column(name = "notes", length = 1000)
    private String notes;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    @Column(name = "ordered_at")
    private Instant orderedAt;

    @Column(name = "received_at")
    private Instant receivedAt;

    @OneToMany(mappedBy = "supplierOrder", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    private List<SupplierOrderItem> items = new ArrayList<>();

    public SupplierOrder() {
    }

    public SupplierOrder(String orderNumber, Long storeId, String supplierName) {
        this.orderNumber = orderNumber;
        this.storeId = storeId;
        this.supplierName = supplierName;
        this.status = SupplierOrderStatus.COMMANDE;
        this.orderedAt = Instant.now();
        this.createdAt = Instant.now();
    }

    public void addItem(SupplierOrderItem item) {
        this.items.add(item);
        item.setSupplierOrder(this);
    }

    public void recalculateTotals() {
        long ht = 0L;
        long vat = 0L;
        for (SupplierOrderItem item : items) {
            ht += item.getTotalPurchasePriceHtCents();
            // TVA à 20% standard pour le réassort joaillier
            vat += Math.round(item.getTotalPurchasePriceHtCents() * 0.20);
        }
        this.totalAmountHtCents = ht;
        this.totalVatCents = vat;
        this.totalAmountTtcCents = ht + vat;
    }

    // Getters and setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getOrderNumber() {
        return orderNumber;
    }

    public void setOrderNumber(String orderNumber) {
        this.orderNumber = orderNumber;
    }

    public Long getStoreId() {
        return storeId;
    }

    public void setStoreId(Long storeId) {
        this.storeId = storeId;
    }

    public String getSupplierName() {
        return supplierName;
    }

    public void setSupplierName(String supplierName) {
        this.supplierName = supplierName;
    }

    public SupplierOrderStatus getStatus() {
        return status;
    }

    public void setStatus(SupplierOrderStatus status) {
        this.status = status;
    }

    public String getDestinationStock() {
        return destinationStock;
    }

    public void setDestinationStock(String destinationStock) {
        this.destinationStock = destinationStock;
    }

    public Long getTotalAmountHtCents() {
        return totalAmountHtCents;
    }

    public void setTotalAmountHtCents(Long totalAmountHtCents) {
        this.totalAmountHtCents = totalAmountHtCents;
    }

    public Long getTotalVatCents() {
        return totalVatCents;
    }

    public void setTotalVatCents(Long totalVatCents) {
        this.totalVatCents = totalVatCents;
    }

    public Long getTotalAmountTtcCents() {
        return totalAmountTtcCents;
    }

    public void setTotalAmountTtcCents(Long totalAmountTtcCents) {
        this.totalAmountTtcCents = totalAmountTtcCents;
    }

    public String getNotes() {
        return notes;
    }

    public void setNotes(String notes) {
        this.notes = notes;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }

    public Instant getOrderedAt() {
        return orderedAt;
    }

    public void setOrderedAt(Instant orderedAt) {
        this.orderedAt = orderedAt;
    }

    public Instant getReceivedAt() {
        return receivedAt;
    }

    public void setReceivedAt(Instant receivedAt) {
        this.receivedAt = receivedAt;
    }

    public List<SupplierOrderItem> getItems() {
        return items;
    }

    public void setItems(List<SupplierOrderItem> items) {
        this.items = items;
    }
}
