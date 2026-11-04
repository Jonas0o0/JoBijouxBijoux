package fr.bijoux.erp.pos.domain.model;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "pos_ticket")
public class PosTicket {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "ticket_number", nullable = false, unique = true, length = 60)
    private String ticketNumber;

    @Column(name = "store_id", nullable = false)
    private Long storeId;

    @Column(name = "operator_username", nullable = false, length = 100)
    private String operatorUsername;

    @Column(name = "customer_id")
    private Long customerId;

    @Column(name = "total_ht_cents", nullable = false)
    private Long totalHtCents;

    @Column(name = "total_vat_cents", nullable = false)
    private Long totalVatCents;

    @Column(name = "total_ttc_cents", nullable = false)
    private Long totalTtcCents;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 30)
    private PosTicketStatus status = PosTicketStatus.COMPLETED;

    @Column(name = "previous_hash", nullable = false, length = 64)
    private String previousHash;

    @Column(name = "current_hash", nullable = false, length = 64)
    private String currentHash;

    @Column(name = "signature", nullable = false, length = 128)
    private String signature;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt = Instant.now();

    @OneToMany(mappedBy = "ticket", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    private List<PosTicketLine> lines = new ArrayList<>();

    @OneToMany(mappedBy = "ticket", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    private List<PaymentTransaction> payments = new ArrayList<>();

    public PosTicket() {
    }

    public PosTicket(String ticketNumber, Long storeId, String operatorUsername, Long customerId,
                     Long totalHtCents, Long totalVatCents, Long totalTtcCents,
                     String previousHash, String currentHash, String signature) {
        this.ticketNumber = ticketNumber;
        this.storeId = storeId;
        this.operatorUsername = operatorUsername;
        this.customerId = customerId;
        this.totalHtCents = totalHtCents;
        this.totalVatCents = totalVatCents;
        this.totalTtcCents = totalTtcCents;
        this.previousHash = previousHash;
        this.currentHash = currentHash;
        this.signature = signature;
        this.createdAt = Instant.now();
    }

    public void addLine(PosTicketLine line) {
        this.lines.add(line);
        line.setTicket(this);
    }

    public void addPayment(PaymentTransaction payment) {
        this.payments.add(payment);
        payment.setTicket(this);
    }

    // Getters and setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getTicketNumber() { return ticketNumber; }
    public void setTicketNumber(String ticketNumber) { this.ticketNumber = ticketNumber; }

    public Long getStoreId() { return storeId; }
    public void setStoreId(Long storeId) { this.storeId = storeId; }

    public String getOperatorUsername() { return operatorUsername; }
    public void setOperatorUsername(String operatorUsername) { this.operatorUsername = operatorUsername; }

    public Long getCustomerId() { return customerId; }
    public void setCustomerId(Long customerId) { this.customerId = customerId; }

    public Long getTotalHtCents() { return totalHtCents; }
    public void setTotalHtCents(Long totalHtCents) { this.totalHtCents = totalHtCents; }

    public Long getTotalVatCents() { return totalVatCents; }
    public void setTotalVatCents(Long totalVatCents) { this.totalVatCents = totalVatCents; }

    public Long getTotalTtcCents() { return totalTtcCents; }
    public void setTotalTtcCents(Long totalTtcCents) { this.totalTtcCents = totalTtcCents; }

    public PosTicketStatus getStatus() { return status; }
    public void setStatus(PosTicketStatus status) { this.status = status; }

    public String getPreviousHash() { return previousHash; }
    public void setPreviousHash(String previousHash) { this.previousHash = previousHash; }

    public String getCurrentHash() { return currentHash; }
    public void setCurrentHash(String currentHash) { this.currentHash = currentHash; }

    public String getSignature() { return signature; }
    public void setSignature(String signature) { this.signature = signature; }

    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }

    public List<PosTicketLine> getLines() { return lines; }
    public void setLines(List<PosTicketLine> lines) { this.lines = lines; }

    public List<PaymentTransaction> getPayments() { return payments; }
    public void setPayments(List<PaymentTransaction> payments) { this.payments = payments; }
}
