package fr.bijoux.erp.weightaccount.dto;

import fr.bijoux.erp.weightaccount.domain.model.GoldFixingRate;

import java.time.Instant;
import java.util.Locale;

public record GoldFixingDto(
        String metalType,
        String currency,
        long spotPricePerGramCents,
        String spotPricePerGramFormatted,
        Instant fixingTimestamp,
        String source
) {
    public static GoldFixingDto fromEntity(GoldFixingRate rate) {
        return new GoldFixingDto(
                rate.getMetalType(),
                rate.getCurrency(),
                rate.getSpotPricePerGramCents(),
                String.format(Locale.US, "%.2f %s/g", rate.getSpotPricePerGramCents() / 100.0, rate.getCurrency()),
                rate.getFixingTimestamp(),
                rate.getSource()
        );
    }
}
