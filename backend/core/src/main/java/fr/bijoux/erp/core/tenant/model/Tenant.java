package fr.bijoux.erp.core.tenant.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.Instant;
import java.util.Objects;

/**
 * Entité représentant une entreprise / maison de joaillerie cliente SaaS (Tenant).
 */
@Entity
@Table(name = "tenants", indexes = {
        @Index(name = "idx_tenants_code", columnList = "code", unique = true)
})
public class Tenant {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank
    @Size(max = 50)
    @Column(name = "code", nullable = false, unique = true, length = 50)
    private String code;

    @NotBlank
    @Size(max = 150)
    @Column(name = "name", nullable = false, length = 150)
    private String name;

    @Size(max = 20)
    @Column(name = "siret", length = 20)
    private String siret;

    @NotNull
    @Enumerated(EnumType.STRING)
    @Column(name = "plan", nullable = false, length = 50)
    private TenantPlan plan = TenantPlan.STANDARD;

    @Column(name = "active", nullable = false)
    private boolean active = true;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    public Tenant() {
    }

    public Tenant(String code, String name) {
        this(code, name, null, TenantPlan.STANDARD);
    }

    public Tenant(String code, String name, String siret, TenantPlan plan) {
        this.code = code;
        this.name = name;
        this.siret = siret;
        this.plan = plan != null ? plan : TenantPlan.STANDARD;
        this.active = true;
        this.createdAt = Instant.now();
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
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

    public String getSiret() {
        return siret;
    }

    public void setSiret(String siret) {
        this.siret = siret;
    }

    public TenantPlan getPlan() {
        return plan;
    }

    public void setPlan(TenantPlan plan) {
        this.plan = plan;
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
        if (!(o instanceof Tenant tenant)) return false;
        return Objects.equals(code, tenant.code);
    }

    @Override
    public int hashCode() {
        return Objects.hash(code);
    }

    @Override
    public String toString() {
        return "Tenant{" +
                "id=" + id +
                ", code='" + code + '\'' +
                ", name='" + name + '\'' +
                ", plan=" + plan +
                ", active=" + active +
                '}';
    }
}
