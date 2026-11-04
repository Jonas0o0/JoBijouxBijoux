package fr.bijoux.erp.catalog.domain.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.Instant;
import java.util.Objects;

/**
 * Emplacement physique d'un bijou (Coffre-fort, vitrine n°X, plateau n°Y, tiroir SAV).
 */
@Entity
@Table(name = "storage_location", indexes = {
        @Index(name = "idx_storage_store_code", columnList = "store_id, code", unique = true),
        @Index(name = "idx_storage_type", columnList = "location_type")
})
public class StorageLocation {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotNull
    @Column(name = "store_id", nullable = false)
    private Long storeId;

    @NotBlank
    @Size(max = 50)
    @Column(name = "code", nullable = false, length = 50)
    private String code;

    @NotBlank
    @Size(max = 120)
    @Column(name = "name", nullable = false, length = 120)
    private String name;

    @NotNull
    @Enumerated(EnumType.STRING)
    @Column(name = "location_type", nullable = false, length = 40)
    private StorageLocationType locationType;

    @Size(max = 255)
    @Column(name = "description")
    private String description;

    @Column(name = "active", nullable = false)
    private boolean active = true;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    public StorageLocation() {
    }

    public StorageLocation(Long storeId, String code, String name, StorageLocationType locationType) {
        this.storeId = storeId;
        this.code = code;
        this.name = name;
        this.locationType = locationType;
        this.active = true;
        this.createdAt = Instant.now();
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getStoreId() {
        return storeId;
    }

    public void setStoreId(Long storeId) {
        this.storeId = storeId;
    }

    public String getCode() {
        return code;
    }

    public void setCode(String code) {
        this.code = code;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public StorageLocationType getLocationType() {
        return locationType;
    }

    public void setLocationType(StorageLocationType locationType) {
        this.locationType = locationType;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public boolean isActive() {
        return active;
    }

    public void setActive(boolean active) {
        this.active = active;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof StorageLocation that)) return false;
        return Objects.equals(storeId, that.storeId) && Objects.equals(code, that.code);
    }

    @Override
    public int hashCode() {
        return Objects.hash(storeId, code);
    }
}
