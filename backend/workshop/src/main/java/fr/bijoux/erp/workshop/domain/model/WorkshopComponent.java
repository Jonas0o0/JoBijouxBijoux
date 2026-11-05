package fr.bijoux.erp.workshop.domain.model;

import jakarta.persistence.*;

@Entity
@Table(name = "workshop_component")
public class WorkshopComponent {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "repair_order_id")
    private RepairOrder repairOrder;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "custom_order_id")
    private CustomManufacturingOrder customOrder;

    @Column(name = "component_name", nullable = false, length = 150)
    private String componentName;

    @Column(name = "quantity", nullable = false)
    private int quantity = 1;

    @Column(name = "unit_cost_cents", nullable = false)
    private Long unitCostCents;

    public WorkshopComponent() {
    }

    public WorkshopComponent(String componentName, int quantity, Long unitCostCents) {
        this.componentName = componentName;
        this.quantity = quantity;
        this.unitCostCents = unitCostCents;
    }

    // Getters and setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public RepairOrder getRepairOrder() { return repairOrder; }
    public void setRepairOrder(RepairOrder repairOrder) { this.repairOrder = repairOrder; }

    public CustomManufacturingOrder getCustomOrder() { return customOrder; }
    public void setCustomOrder(CustomManufacturingOrder customOrder) { this.customOrder = customOrder; }

    public String getComponentName() { return componentName; }
    public void setComponentName(String componentName) { this.componentName = componentName; }

    public int getQuantity() { return quantity; }
    public void setQuantity(int quantity) { this.quantity = quantity; }

    public Long getUnitCostCents() { return unitCostCents; }
    public void setUnitCostCents(Long unitCostCents) { this.unitCostCents = unitCostCents; }
}
