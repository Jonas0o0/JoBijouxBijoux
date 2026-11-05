package fr.bijoux.erp.gold.domain.model;

import jakarta.persistence.*;
import java.math.BigDecimal;

@Entity
@Table(name = "gold_scrap_item")
public class GoldScrapItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "dossier_id", nullable = false)
    private GoldRepurchaseDossier dossier;

    @Column(name = "description", nullable = false)
    private String description;

    @Column(name = "metal_type", nullable = false, length = 40)
    private String metalType;

    @Column(name = "fineness", nullable = false, length = 40)
    private String fineness;

    @Column(name = "gross_weight_grams", nullable = false, precision = 10, scale = 3)
    private BigDecimal grossWeightGrams;

    @Column(name = "estimated_net_weight_grams", nullable = false, precision = 10, scale = 3)
    private BigDecimal estimatedNetWeightGrams;

    @Column(name = "purity_rate", nullable = false, precision = 5, scale = 4)
    private BigDecimal purityRate;

    @Column(name = "unit_price_per_gram_cents", nullable = false)
    private Long unitPricePerGramCents;

    @Column(name = "total_price_cents", nullable = false)
    private Long totalPriceCents;

    public GoldScrapItem() {
    }

    public GoldScrapItem(String description, String metalType, String fineness,
                         BigDecimal grossWeightGrams, BigDecimal estimatedNetWeightGrams,
                         BigDecimal purityRate, Long unitPricePerGramCents, Long totalPriceCents) {
        this.description = description;
        this.metalType = metalType;
        this.fineness = fineness;
        this.grossWeightGrams = grossWeightGrams;
        this.estimatedNetWeightGrams = estimatedNetWeightGrams;
        this.purityRate = purityRate;
        this.unitPricePerGramCents = unitPricePerGramCents;
        this.totalPriceCents = totalPriceCents;
    }

    // Getters and setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public GoldRepurchaseDossier getDossier() { return dossier; }
    public void setDossier(GoldRepurchaseDossier dossier) { this.dossier = dossier; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public String getMetalType() { return metalType; }
    public void setMetalType(String metalType) { this.metalType = metalType; }

    public String getFineness() { return fineness; }
    public void setFineness(String fineness) { this.fineness = fineness; }

    public BigDecimal getGrossWeightGrams() { return grossWeightGrams; }
    public void setGrossWeightGrams(BigDecimal grossWeightGrams) { this.grossWeightGrams = grossWeightGrams; }

    public BigDecimal getEstimatedNetWeightGrams() { return estimatedNetWeightGrams; }
    public void setEstimatedNetWeightGrams(BigDecimal estimatedNetWeightGrams) { this.estimatedNetWeightGrams = estimatedNetWeightGrams; }

    public BigDecimal getPurityRate() { return purityRate; }
    public void setPurityRate(BigDecimal purityRate) { this.purityRate = purityRate; }

    public Long getUnitPricePerGramCents() { return unitPricePerGramCents; }
    public void setUnitPricePerGramCents(Long unitPricePerGramCents) { this.unitPricePerGramCents = unitPricePerGramCents; }

    public Long getTotalPriceCents() { return totalPriceCents; }
    public void setTotalPriceCents(Long totalPriceCents) { this.totalPriceCents = totalPriceCents; }
}
