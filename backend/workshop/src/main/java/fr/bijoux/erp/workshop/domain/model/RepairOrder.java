package fr.bijoux.erp.workshop.domain.model;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "workshop_repair_order")
public class RepairOrder {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "order_number", nullable = false, unique = true, length = 60)
    private String orderNumber;

    @Column(name = "store_id", nullable = false)
    private Long storeId;

    @Column(name = "customer_id")
    private Long customerId;

    @Column(name = "operator_username", nullable = false, length = 100)
    private String operatorUsername;

    @Column(name = "assigned_artisan_username", length = 100)
    private String assignedArtisanUsername;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 40)
    private WorkshopStatus status = WorkshopStatus.DEPOT;

    @Column(name = "item_description", nullable = false, length = 500)
    private String itemDescription;

    @Column(name = "metal_type", nullable = false, length = 40)
    private String metalType;

    @Column(name = "fineness", nullable = false, length = 40)
    private String fineness;

    @Column(name = "gross_weight_grams", nullable = false, precision = 10, scale = 3)
    private BigDecimal grossWeightGrams;

    @Column(name = "macro_photo_url", length = 500)
    private String macroPhotoUrl;

    @Column(name = "svg_defect_diagram", columnDefinition = "TEXT")
    private String svgDefectDiagram;

    @Column(name = "estimated_quote_cents")
    private Long estimatedQuoteCents;

    @Column(name = "final_price_cents")
    private Long finalPriceCents;

    @Column(name = "customer_notes", columnDefinition = "TEXT")
    private String customerNotes;

    @Column(name = "deposit_date", nullable = false)
    private Instant depositDate = Instant.now();

    @Column(name = "target_delivery_date")
    private Instant targetDeliveryDate;

    @Column(name = "actual_delivery_date")
    private Instant actualDeliveryDate;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt = Instant.now();

    @Column(name = "updated_at")
    private Instant updatedAt;

    @OneToMany(mappedBy = "repairOrder", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    private List<WorkshopComponent> components = new ArrayList<>();

    public RepairOrder() {
    }

    public RepairOrder(String orderNumber, Long storeId, Long customerId, String operatorUsername,
                       String itemDescription, String metalType, String fineness,
                       BigDecimal grossWeightGrams, String svgDefectDiagram, Long estimatedQuoteCents) {
        this.orderNumber = orderNumber;
        this.storeId = storeId;
        this.customerId = customerId;
        this.operatorUsername = operatorUsername;
        this.itemDescription = itemDescription;
        this.metalType = metalType;
        this.fineness = fineness;
        this.grossWeightGrams = grossWeightGrams;
        this.svgDefectDiagram = svgDefectDiagram;
        this.estimatedQuoteCents = estimatedQuoteCents;
        this.status = WorkshopStatus.DEPOT;
        this.depositDate = Instant.now();
        this.createdAt = Instant.now();
    }

    public void addComponent(WorkshopComponent component) {
        this.components.add(component);
        component.setRepairOrder(this);
    }

    // Getters and setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getOrderNumber() { return orderNumber; }
    public void setOrderNumber(String orderNumber) { this.orderNumber = orderNumber; }

    public Long getStoreId() { return storeId; }
    public void setStoreId(Long storeId) { this.storeId = storeId; }

    public Long getCustomerId() { return customerId; }
    public void setCustomerId(Long customerId) { this.customerId = customerId; }

    public String getOperatorUsername() { return operatorUsername; }
    public void setOperatorUsername(String operatorUsername) { this.operatorUsername = operatorUsername; }

    public String getAssignedArtisanUsername() { return assignedArtisanUsername; }
    public void setAssignedArtisanUsername(String assignedArtisanUsername) { this.assignedArtisanUsername = assignedArtisanUsername; }

    public WorkshopStatus getStatus() { return status; }
    public void setStatus(WorkshopStatus status) { this.status = status; }

    public String getItemDescription() { return itemDescription; }
    public void setItemDescription(String itemDescription) { this.itemDescription = itemDescription; }

    public String getMetalType() { return metalType; }
    public void setMetalType(String metalType) { this.metalType = metalType; }

    public String getFineness() { return fineness; }
    public void setFineness(String fineness) { this.fineness = fineness; }

    public BigDecimal getGrossWeightGrams() { return grossWeightGrams; }
    public void setGrossWeightGrams(BigDecimal grossWeightGrams) { this.grossWeightGrams = grossWeightGrams; }

    public String getMacroPhotoUrl() { return macroPhotoUrl; }
    public void setMacroPhotoUrl(String macroPhotoUrl) { this.macroPhotoUrl = macroPhotoUrl; }

    public String getSvgDefectDiagram() { return svgDefectDiagram; }
    public void setSvgDefectDiagram(String svgDefectDiagram) { this.svgDefectDiagram = svgDefectDiagram; }

    public Long getEstimatedQuoteCents() { return estimatedQuoteCents; }
    public void setEstimatedQuoteCents(Long estimatedQuoteCents) { this.estimatedQuoteCents = estimatedQuoteCents; }

    public Long getFinalPriceCents() { return finalPriceCents; }
    public void setFinalPriceCents(Long finalPriceCents) { this.finalPriceCents = finalPriceCents; }

    public String getCustomerNotes() { return customerNotes; }
    public void setCustomerNotes(String customerNotes) { this.customerNotes = customerNotes; }

    public Instant getDepositDate() { return depositDate; }
    public void setDepositDate(Instant depositDate) { this.depositDate = depositDate; }

    public Instant getTargetDeliveryDate() { return targetDeliveryDate; }
    public void setTargetDeliveryDate(Instant targetDeliveryDate) { this.targetDeliveryDate = targetDeliveryDate; }

    public Instant getActualDeliveryDate() { return actualDeliveryDate; }
    public void setActualDeliveryDate(Instant actualDeliveryDate) { this.actualDeliveryDate = actualDeliveryDate; }

    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }

    public Instant getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(Instant updatedAt) { this.updatedAt = updatedAt; }

    public List<WorkshopComponent> getComponents() { return components; }
    public void setComponents(List<WorkshopComponent> components) { this.components = components; }
}
