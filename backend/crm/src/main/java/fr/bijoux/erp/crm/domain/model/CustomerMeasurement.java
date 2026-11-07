package fr.bijoux.erp.crm.domain.model;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.Instant;

@Entity
@Table(name = "crm_customer_measurement")
public class CustomerMeasurement {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "customer_id", nullable = false)
    private Customer customer;

    @Enumerated(EnumType.STRING)
    @Column(name = "measurement_type", nullable = false, length = 40)
    private MeasurementType measurementType;

    @Column(name = "\"value\"", nullable = false, precision = 6, scale = 2)
    private BigDecimal value;

    @Column(name = "finger_name", length = 60)
    private String fingerName;

    @Column(name = "recorded_at", nullable = false)
    private Instant recordedAt = Instant.now();

    public CustomerMeasurement() {
    }

    public CustomerMeasurement(MeasurementType measurementType, BigDecimal value, String fingerName) {
        this.measurementType = measurementType;
        this.value = value;
        this.fingerName = fingerName;
        this.recordedAt = Instant.now();
    }

    // Getters and setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Customer getCustomer() { return customer; }
    public void setCustomer(Customer customer) { this.customer = customer; }

    public MeasurementType getMeasurementType() { return measurementType; }
    public void setMeasurementType(MeasurementType measurementType) { this.measurementType = measurementType; }

    public BigDecimal getValue() { return value; }
    public void setValue(BigDecimal value) { this.value = value; }

    public String getFingerName() { return fingerName; }
    public void setFingerName(String fingerName) { this.fingerName = fingerName; }

    public Instant getRecordedAt() { return recordedAt; }
    public void setRecordedAt(Instant recordedAt) { this.recordedAt = recordedAt; }
}
