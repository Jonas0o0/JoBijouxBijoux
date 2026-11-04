package fr.bijoux.erp.catalog.domain.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.Instant;

/**
 * Journal des mouvements physiques d'articles précieux (traçabilité interne).
 */
@Entity
@Table(name = "inventory_movement", indexes = {
        @Index(name = "idx_inv_mov_item", columnList = "jewelry_item_id"),
        @Index(name = "idx_inv_mov_timestamp", columnList = "timestamp")
})
public class InventoryMovement {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotNull
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "jewelry_item_id", nullable = false)
    private JewelryItem jewelryItem;

    @NotNull
    @Enumerated(EnumType.STRING)
    @Column(name = "movement_type", nullable = false, length = 40)
    private MovementType movementType;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "from_location_id")
    private StorageLocation fromLocation;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "to_location_id")
    private StorageLocation toLocation;

    @NotBlank
    @Size(max = 100)
    @Column(name = "performed_by", nullable = false, length = 100)
    private String performedBy;

    @NotNull
    @Column(name = "timestamp", nullable = false, updatable = false)
    private Instant timestamp = Instant.now();

    @Column(name = "notes")
    private String notes;

    public InventoryMovement() {
    }

    public InventoryMovement(JewelryItem jewelryItem,
                             MovementType movementType,
                             StorageLocation fromLocation,
                             StorageLocation toLocation,
                             String performedBy,
                             String notes) {
        this.jewelryItem = jewelryItem;
        this.movementType = movementType;
        this.fromLocation = fromLocation;
        this.toLocation = toLocation;
        this.performedBy = performedBy;
        this.notes = notes;
        this.timestamp = Instant.now();
    }

    public Long getId() {
        return id;
    }

    public JewelryItem getJewelryItem() {
        return jewelryItem;
    }

    public MovementType getMovementType() {
        return movementType;
    }

    public StorageLocation getFromLocation() {
        return fromLocation;
    }

    public StorageLocation getToLocation() {
        return toLocation;
    }

    public String getPerformedBy() {
        return performedBy;
    }

    public Instant getTimestamp() {
        return timestamp;
    }

    public String getNotes() {
        return notes;
    }
}
