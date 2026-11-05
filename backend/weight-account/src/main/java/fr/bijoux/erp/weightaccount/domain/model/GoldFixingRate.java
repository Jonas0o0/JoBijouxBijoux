package fr.bijoux.erp.weightaccount.domain.model;

import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "gold_fixing_rate")
public class GoldFixingRate {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "metal_type", nullable = false, length = 40)
    private String metalType = "GOLD";

    @Column(name = "currency", nullable = false, length = 10)
    private String currency = "EUR";

    @Column(name = "spot_price_per_gram_cents", nullable = false)
    private Long spotPricePerGramCents;

    @Column(name = "fixing_timestamp", nullable = false)
    private Instant fixingTimestamp = Instant.now();

    @Column(name = "source", nullable = false, length = 80)
    private String source;

    public GoldFixingRate() {
    }

    public GoldFixingRate(String metalType, String currency, Long spotPricePerGramCents, String source) {
        this.metalType = metalType != null ? metalType : "GOLD";
        this.currency = currency != null ? currency : "EUR";
        this.spotPricePerGramCents = spotPricePerGramCents;
        this.source = source;
        this.fixingTimestamp = Instant.now();
    }

    // Getters and setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getMetalType() { return metalType; }
    public void setMetalType(String metalType) { this.metalType = metalType; }

    public String getCurrency() { return currency; }
    public void setCurrency(String currency) { this.currency = currency; }

    public Long getSpotPricePerGramCents() { return spotPricePerGramCents; }
    public void setSpotPricePerGramCents(Long spotPricePerGramCents) { this.spotPricePerGramCents = spotPricePerGramCents; }

    public Instant getFixingTimestamp() { return fixingTimestamp; }
    public void setFixingTimestamp(Instant fixingTimestamp) { this.fixingTimestamp = fixingTimestamp; }

    public String getSource() { return source; }
    public void setSource(String source) { this.source = source; }
}
