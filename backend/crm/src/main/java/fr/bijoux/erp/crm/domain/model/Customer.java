package fr.bijoux.erp.crm.domain.model;

import jakarta.persistence.*;
import java.time.Instant;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "crm_customer")
public class Customer {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "first_name", nullable = false, length = 80)
    private String firstName;

    @Column(name = "last_name", nullable = false, length = 80)
    private String lastName;

    @Column(name = "email", length = 120, unique = true)
    private String email;

    @Column(name = "phone", length = 40)
    private String phone;

    @Column(name = "address", length = 255)
    private String address;

    @Column(name = "city", length = 100)
    private String city;

    @Column(name = "postal_code", length = 20)
    private String postalCode;

    @Column(name = "cni_passport_number", length = 80)
    private String cniPassportNumber;

    @Column(name = "cni_expiry_date")
    private LocalDate cniExpiryDate;

    @Column(name = "notes", columnDefinition = "TEXT")
    private String notes;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt = Instant.now();

    @Column(name = "updated_at")
    private Instant updatedAt;

    @OneToMany(mappedBy = "customer", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    private List<CustomerMeasurement> measurements = new ArrayList<>();

    public Customer() {
    }

    public Customer(String firstName, String lastName, String email, String phone,
                    String address, String city, String postalCode,
                    String cniPassportNumber, LocalDate cniExpiryDate) {
        this.firstName = firstName;
        this.lastName = lastName;
        this.email = email;
        this.phone = phone;
        this.address = address;
        this.city = city;
        this.postalCode = postalCode;
        this.cniPassportNumber = cniPassportNumber;
        this.cniExpiryDate = cniExpiryDate;
        this.createdAt = Instant.now();
    }

    public void addMeasurement(CustomerMeasurement measurement) {
        this.measurements.add(measurement);
        measurement.setCustomer(this);
    }

    // Getters and setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getFirstName() { return firstName; }
    public void setFirstName(String firstName) { this.firstName = firstName; }

    public String getLastName() { return lastName; }
    public void setLastName(String lastName) { this.lastName = lastName; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }

    public String getAddress() { return address; }
    public void setAddress(String address) { this.address = address; }

    public String getCity() { return city; }
    public void setCity(String city) { this.city = city; }

    public String getPostalCode() { return postalCode; }
    public void setPostalCode(String postalCode) { this.postalCode = postalCode; }

    public String getCniPassportNumber() { return cniPassportNumber; }
    public void setCniPassportNumber(String cniPassportNumber) { this.cniPassportNumber = cniPassportNumber; }

    public LocalDate getCniExpiryDate() { return cniExpiryDate; }
    public void setCniExpiryDate(LocalDate cniExpiryDate) { this.cniExpiryDate = cniExpiryDate; }

    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }

    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }

    public Instant getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(Instant updatedAt) { this.updatedAt = updatedAt; }

    public List<CustomerMeasurement> getMeasurements() { return measurements; }
    public void setMeasurements(List<CustomerMeasurement> measurements) { this.measurements = measurements; }
}
