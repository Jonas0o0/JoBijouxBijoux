package fr.bijoux.erp.weightaccount.domain.service;

import fr.bijoux.erp.weightaccount.domain.model.GoldFixingRate;
import fr.bijoux.erp.weightaccount.domain.model.WeightAccountLedger;
import fr.bijoux.erp.weightaccount.domain.model.WeightMovementType;
import fr.bijoux.erp.weightaccount.domain.repository.GoldFixingRateRepository;
import fr.bijoux.erp.weightaccount.domain.repository.WeightAccountLedgerRepository;
import fr.bijoux.erp.weightaccount.dto.GoldFixingDto;
import fr.bijoux.erp.weightaccount.dto.RecordFixingRequest;
import fr.bijoux.erp.weightaccount.dto.WeightAccountBalanceDto;
import fr.bijoux.erp.weightaccount.dto.WeightMovementRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;

@Service
public class WeightAccountService {

    private final WeightAccountLedgerRepository ledgerRepository;
    private final GoldFixingRateRepository fixingRepository;

    public WeightAccountService(WeightAccountLedgerRepository ledgerRepository,
                                GoldFixingRateRepository fixingRepository) {
        this.ledgerRepository = ledgerRepository;
        this.fixingRepository = fixingRepository;
    }

    @Transactional
    public WeightAccountLedger recordMovement(WeightMovementRequest request) {
        String metal = (request.metalType() != null && !request.metalType().isBlank())
                ? request.metalType().toUpperCase()
                : "GOLD";

        BigDecimal currentBalance = ledgerRepository
                .findTopByStoreIdAndPartnerNameAndMetalTypeOrderByTimestampDescIdDesc(request.storeId(), request.partnerName(), metal)
                .map(WeightAccountLedger::getBalanceAfterGrams)
                .orElse(BigDecimal.ZERO.setScale(3, RoundingMode.HALF_UP));

        BigDecimal newBalance = switch (request.movementType()) {
            case CREDIT_FINE_GOLD -> currentBalance.add(request.weightFineGoldGrams()).setScale(3, RoundingMode.HALF_UP);
            case DEBIT_FINE_GOLD -> currentBalance.subtract(request.weightFineGoldGrams()).setScale(3, RoundingMode.HALF_UP);
            case ADJUSTMENT -> request.weightFineGoldGrams().setScale(3, RoundingMode.HALF_UP);
        };

        WeightAccountLedger entry = new WeightAccountLedger(
                request.storeId(),
                request.partnerName(),
                request.partnerType(),
                metal,
                request.movementType(),
                request.weightFineGoldGrams().setScale(3, RoundingMode.HALF_UP),
                newBalance,
                request.referenceDocument(),
                request.notes()
        );

        return ledgerRepository.save(entry);
    }

    @Transactional(readOnly = true)
    public WeightAccountBalanceDto getCurrentBalance(Long storeId, String partnerName, String metalType) {
        String metal = (metalType != null && !metalType.isBlank()) ? metalType.toUpperCase() : "GOLD";

        return ledgerRepository.findTopByStoreIdAndPartnerNameAndMetalTypeOrderByTimestampDescIdDesc(storeId, partnerName, metal)
                .map(last -> new WeightAccountBalanceDto(
                        storeId, partnerName, last.getPartnerType(), metal, last.getBalanceAfterGrams(), last.getTimestamp()
                ))
                .orElseGet(() -> new WeightAccountBalanceDto(
                        storeId, partnerName, "INCONNU", metal, BigDecimal.ZERO.setScale(3, RoundingMode.HALF_UP), Instant.now()
                ));
    }

    @Transactional
    public GoldFixingDto recordFixing(RecordFixingRequest request) {
        String metal = (request.metalType() != null && !request.metalType().isBlank())
                ? request.metalType().toUpperCase()
                : "GOLD";
        String currency = (request.currency() != null && !request.currency().isBlank())
                ? request.currency().toUpperCase()
                : "EUR";

        GoldFixingRate rate = new GoldFixingRate(metal, currency, request.spotPricePerGramCents(), request.source());
        GoldFixingRate saved = fixingRepository.save(rate);
        return GoldFixingDto.fromEntity(saved);
    }

    @Transactional(readOnly = true)
    public GoldFixingDto getLatestFixing(String metalType) {
        String metal = (metalType != null && !metalType.isBlank()) ? metalType.toUpperCase() : "GOLD";

        return fixingRepository.findTopByMetalTypeOrderByFixingTimestampDesc(metal)
                .map(GoldFixingDto::fromEntity)
                .orElseGet(() -> new GoldFixingDto(
                        metal, "EUR", 7500L, "75.00 EUR/g (Cours indicatif par défaut)", Instant.now(), "DEFAULT_REF"
                ));
    }
}
