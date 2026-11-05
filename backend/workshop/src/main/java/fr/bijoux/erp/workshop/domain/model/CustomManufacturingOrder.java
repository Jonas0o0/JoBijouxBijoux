package fr.bijoux.erp.workshop.domain.model;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "workshop_custom_order")
public class CustomManufacturingOrder {

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
    private WorkshopStatus status = WorkshopStatus.DEVIS;

    @Column(name = "title", nullable = false, length = 200)
    private String title;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @Column(name = "estimated_gold_weight_grams", nullable = false, precision = 10, scale = 3)
    private BigDecimal estimatedGoldWeightGrams;

    @Column(name = "fire_loss_percentage", nullable = false, precision = 5, scale = 2)
    private BigDecimal fireLossPercentage = new BigDecimal("5.00"); // 3% à 8% freinte

    @Column(name = "final_weight_grams", precision = 10, scale = 3)
    private BigDecimal finalWeightGrams;

    @Column(name = "quote_price_cents", nullable = false)
    private Long quotePriceCents;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt = Instant.now();

    @Column(name = "updated_at")
    private Instant updatedAt;

    @OneToMany(mappedBy = "customOrder", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    private List<WorkshopComponent> components = new ArrayList<>();

    public CustomManufacturingOrder() {
    }

    public CustomManufacturingOrder(String orderNumber, Long storeId, Long customerId,
                                    String operatorUsername, String title, String description,
                                    BigDecimal estimatedGoldWeightGrams, BigDecimal fireLossPercentage,
                                    Long quotePriceCents) {
        this.orderNumber = orderNumber;
        this.storeId = storeId;
        this.customerId = customerId;
        this.operatorUsername = operatorUsername;
        this.title = title;
        this.description = description;
        this.estimatedGoldWeightGrams = estimatedGoldWeightGrams;
        this.fireLossPercentage = (fireLossPercentage != null) ? fireLossPercentage : new BigDecimal("5.00");
        this.quotePriceCents = quotePriceCents;
        this.status = WorkshopStatus.DEVIS;
        this.createdAt = Instant.now();
    }

    public void addComponent(WorkshopComponent component) {
        this.components.add(component);
        component.setCustomOrder(this);
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

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public BigDecimal getEstimatedGoldWeightGrams() { return estimatedGoldWeightGrams; }
    public void setEstimatedGoldWeightGrams(BigDecimal estimatedGoldWeightGrams) { this.estimatedGoldWeightGrams = estimatedGoldWeightGrams; }

    public BigDecimal getFireLossPercentage() { return fireLossPercentage; }
    public void setFireLossPercentage(BigDecimal fireLossPercentage) { this.fireLossPercentage = fireLossPercentage; }

    public BigDecimal getFinalWeightGrams() { return finalWeightGrams; }
    public void setFinalWeightGrams(BigDecimal finalWeightGrams) { this.finalWeightGrams = finalWeightGrams; }

    public Long getQuotePriceCents() { return quotePriceCents; }
    public void setQuotePriceCents(Long quotePriceCents) { this.quotePriceCents = quotePriceCents; }

    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }

    public Instant getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(Instant updatedAt) { this.updatedAt = updatedAt; }

    public List<WorkshopComponent> getComponents() { return components; }
    public void setComponents(List<WorkshopComponent> components) { this.components = components; }
}
