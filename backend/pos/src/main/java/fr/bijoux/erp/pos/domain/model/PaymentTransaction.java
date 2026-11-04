package fr.bijoux.erp.pos.domain.model;

import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "payment_transaction")
public class PaymentTransaction {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ticket_id", nullable = false)
    private PosTicket ticket;

    @Enumerated(EnumType.STRING)
    @Column(name = "payment_method", nullable = false, length = 40)
    private PaymentMethod paymentMethod;

    @Column(name = "amount_cents", nullable = false)
    private Long amountCents;

    @Column(name = "transaction_reference", length = 100)
    private String transactionReference;

    @Column(name = "tpe_auth_token", length = 100)
    private String tpeAuthToken;

    @Column(name = "voucher_code", length = 100)
    private String voucherCode;

    @Column(name = "scrap_dossier_id")
    private Long scrapDossierId;

    @Column(name = "status", nullable = false, length = 30)
    private String status = "APPROVED";

    @Column(name = "created_at", nullable = false)
    private Instant createdAt = Instant.now();

    public PaymentTransaction() {
    }

    public PaymentTransaction(PaymentMethod paymentMethod, Long amountCents,
                              String transactionReference, String tpeAuthToken,
                              String voucherCode, Long scrapDossierId) {
        this.paymentMethod = paymentMethod;
        this.amountCents = amountCents;
        this.transactionReference = transactionReference;
        this.tpeAuthToken = tpeAuthToken;
        this.voucherCode = voucherCode;
        this.scrapDossierId = scrapDossierId;
        this.status = "APPROVED";
        this.createdAt = Instant.now();
    }

    // Getters and setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public PosTicket getTicket() { return ticket; }
    public void setTicket(PosTicket ticket) { this.ticket = ticket; }

    public PaymentMethod getPaymentMethod() { return paymentMethod; }
    public void setPaymentMethod(PaymentMethod paymentMethod) { this.paymentMethod = paymentMethod; }

    public Long getAmountCents() { return amountCents; }
    public void setAmountCents(Long amountCents) { this.amountCents = amountCents; }

    public String getTransactionReference() { return transactionReference; }
    public void setTransactionReference(String transactionReference) { this.transactionReference = transactionReference; }

    public String getTpeAuthToken() { return tpeAuthToken; }
    public void setTpeAuthToken(String tpeAuthToken) { this.tpeAuthToken = tpeAuthToken; }

    public String getVoucherCode() { return voucherCode; }
    public void setVoucherCode(String voucherCode) { this.voucherCode = voucherCode; }

    public Long getScrapDossierId() { return scrapDossierId; }
    public void setScrapDossierId(Long scrapDossierId) { this.scrapDossierId = scrapDossierId; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
}
