package fr.bijoux.erp.pos.domain.model;

import fr.bijoux.erp.catalog.domain.model.VatRegime;
import jakarta.persistence.*;
import java.math.BigDecimal;

@Entity
@Table(name = "pos_ticket_line")
public class PosTicketLine {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ticket_id", nullable = false)
    private PosTicket ticket;

    @Column(name = "line_number", nullable = false)
    private int lineNumber;

    @Enumerated(EnumType.STRING)
    @Column(name = "item_type", nullable = false, length = 40)
    private PosItemType itemType;

    @Column(name = "jewelry_item_id")
    private Long jewelryItemId;

    @Column(name = "repair_order_id")
    private Long repairOrderId;

    @Column(name = "designation", nullable = false)
    private String designation;

    @Column(name = "quantity", nullable = false)
    private int quantity = 1;

    @Column(name = "unit_price_ttc_cents", nullable = false)
    private Long unitPriceTtcCents;

    @Column(name = "total_ttc_cents", nullable = false)
    private Long totalTtcCents;

    @Column(name = "vat_rate", nullable = false, precision = 5, scale = 2)
    private BigDecimal vatRate;

    @Enumerated(EnumType.STRING)
    @Column(name = "vat_regime", nullable = false, length = 50)
    private VatRegime vatRegime;

    @Column(name = "vat_amount_cents", nullable = false)
    private Long vatAmountCents;

    public PosTicketLine() {
    }

    public PosTicketLine(int lineNumber, PosItemType itemType, Long jewelryItemId,
                         String designation, int quantity, Long unitPriceTtcCents,
                         Long totalTtcCents, BigDecimal vatRate, VatRegime vatRegime, Long vatAmountCents) {
        this(lineNumber, itemType, jewelryItemId, null, designation, quantity, unitPriceTtcCents, totalTtcCents, vatRate, vatRegime, vatAmountCents);
    }

    public PosTicketLine(int lineNumber, PosItemType itemType, Long jewelryItemId, Long repairOrderId,
                         String designation, int quantity, Long unitPriceTtcCents,
                         Long totalTtcCents, BigDecimal vatRate, VatRegime vatRegime, Long vatAmountCents) {
        this.lineNumber = lineNumber;
        this.itemType = itemType;
        this.jewelryItemId = jewelryItemId;
        this.repairOrderId = repairOrderId;
        this.designation = designation;
        this.quantity = quantity;
        this.unitPriceTtcCents = unitPriceTtcCents;
        this.totalTtcCents = totalTtcCents;
        this.vatRate = vatRate;
        this.vatRegime = vatRegime;
        this.vatAmountCents = vatAmountCents;
    }

    // Getters and setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public PosTicket getTicket() { return ticket; }
    public void setTicket(PosTicket ticket) { this.ticket = ticket; }

    public int getLineNumber() { return lineNumber; }
    public void setLineNumber(int lineNumber) { this.lineNumber = lineNumber; }

    public PosItemType getItemType() { return itemType; }
    public void setItemType(PosItemType itemType) { this.itemType = itemType; }

    public Long getJewelryItemId() { return jewelryItemId; }
    public void setJewelryItemId(Long jewelryItemId) { this.jewelryItemId = jewelryItemId; }

    public Long getRepairOrderId() { return repairOrderId; }
    public void setRepairOrderId(Long repairOrderId) { this.repairOrderId = repairOrderId; }

    public String getDesignation() { return designation; }
    public void setDesignation(String designation) { this.designation = designation; }

    public int getQuantity() { return quantity; }
    public void setQuantity(int quantity) { this.quantity = quantity; }

    public Long getUnitPriceTtcCents() { return unitPriceTtcCents; }
    public void setUnitPriceTtcCents(Long unitPriceTtcCents) { this.unitPriceTtcCents = unitPriceTtcCents; }

    public Long getTotalTtcCents() { return totalTtcCents; }
    public void setTotalTtcCents(Long totalTtcCents) { this.totalTtcCents = totalTtcCents; }

    public BigDecimal getVatRate() { return vatRate; }
    public void setVatRate(BigDecimal vatRate) { this.vatRate = vatRate; }

    public VatRegime getVatRegime() { return vatRegime; }
    public void setVatRegime(VatRegime vatRegime) { this.vatRegime = vatRegime; }

    public Long getVatAmountCents() { return vatAmountCents; }
    public void setVatAmountCents(Long vatAmountCents) { this.vatAmountCents = vatAmountCents; }
}
