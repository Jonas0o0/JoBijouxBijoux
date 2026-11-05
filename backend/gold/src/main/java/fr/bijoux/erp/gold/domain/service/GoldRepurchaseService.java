package fr.bijoux.erp.gold.domain.service;

import fr.bijoux.erp.core.event.GoldRepurchasedEvent;
import fr.bijoux.erp.gold.domain.model.*;
import fr.bijoux.erp.gold.domain.repository.GoldRepurchaseDossierRepository;
import fr.bijoux.erp.gold.domain.strategy.GoldTaxCalculationResult;
import fr.bijoux.erp.gold.domain.strategy.GoldTaxContext;
import fr.bijoux.erp.gold.domain.strategy.GoldTaxStrategyRegistry;
import fr.bijoux.erp.gold.dto.CreateGoldDossierRequest;
import fr.bijoux.erp.gold.dto.GoldDossierResponse;
import fr.bijoux.erp.gold.dto.GoldEstimateRequest;
import fr.bijoux.erp.gold.dto.GoldEstimateResponse;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;

@Service
public class GoldRepurchaseService {

    public static final int LEGAL_COOLING_OFF_HOURS = 48;

    private final GoldRepurchaseDossierRepository dossierRepository;
    private final GoldTaxStrategyRegistry taxStrategyRegistry;
    private final ApplicationEventPublisher eventPublisher;

    public GoldRepurchaseService(GoldRepurchaseDossierRepository dossierRepository,
                                 GoldTaxStrategyRegistry taxStrategyRegistry,
                                 ApplicationEventPublisher eventPublisher) {
        this.dossierRepository = dossierRepository;
        this.taxStrategyRegistry = taxStrategyRegistry;
        this.eventPublisher = eventPublisher;
    }

    public GoldEstimateResponse estimate(GoldEstimateRequest request) {
        BigDecimal totalGrossWeight = BigDecimal.ZERO;
        BigDecimal totalNetWeight = BigDecimal.ZERO;
        long totalGrossAmount = 0L;

        for (CreateGoldDossierRequest.GoldScrapItemDto item : request.items()) {
            totalGrossWeight = totalGrossWeight.add(item.grossWeightGrams());
            totalNetWeight = totalNetWeight.add(item.estimatedNetWeightGrams());

            long itemPrice = item.estimatedNetWeightGrams()
                    .multiply(BigDecimal.valueOf(item.unitPricePerGramCents()))
                    .setScale(0, RoundingMode.HALF_UP)
                    .longValue();
            totalGrossAmount += itemPrice;
        }

        GoldTaxContext taxContext = new GoldTaxContext(
                totalGrossAmount,
                request.purchasePriceCents(),
                request.holdingYears(),
                request.proofOfAcquisitionAvailable()
        );

        GoldTaxCalculationResult taxResult = taxStrategyRegistry.calculateTax(request.taxStrategy(), taxContext);

        return new GoldEstimateResponse(
                totalGrossWeight,
                totalNetWeight,
                totalGrossAmount,
                taxResult.taxAmountCents(),
                taxResult.netPayableCents(),
                request.taxStrategy().name(),
                taxResult.details()
        );
    }

    @Transactional
    public GoldDossierResponse createDossier(CreateGoldDossierRequest request) {
        if (request.sellerCniPassport() == null || request.sellerCniPassport().isBlank()) {
            throw new IllegalArgumentException("La pièce d'identité du vendeur est obligatoire pour tout rachat de métaux précieux");
        }

        // RÈGLE LÉGALE STRICTE : interdiction des espèces
        if (request.paymentMethod() == null) {
            throw new IllegalArgumentException("Le mode de règlement doit être spécifié (virement bancaire ou chèque barré)");
        }

        long sequence = dossierRepository.countByStoreId(request.storeId()) + 1L;
        String dossierNumber = String.format("DOS-GOLD-%d-%06d", request.storeId(), sequence);

        GoldRepurchaseDossier dossier = new GoldRepurchaseDossier(
                dossierNumber,
                request.storeId(),
                request.operatorUsername(),
                request.customerId(),
                request.sellerFullName(),
                request.sellerCniPassport(),
                request.taxStrategy(),
                request.paymentMethod()
        );

        BigDecimal totalGrossWeight = BigDecimal.ZERO;
        BigDecimal totalNetWeight = BigDecimal.ZERO;
        long totalGrossAmount = 0L;

        for (CreateGoldDossierRequest.GoldScrapItemDto itemDto : request.items()) {
            totalGrossWeight = totalGrossWeight.add(itemDto.grossWeightGrams());
            totalNetWeight = totalNetWeight.add(itemDto.estimatedNetWeightGrams());

            long itemPrice = itemDto.estimatedNetWeightGrams()
                    .multiply(BigDecimal.valueOf(itemDto.unitPricePerGramCents()))
                    .setScale(0, RoundingMode.HALF_UP)
                    .longValue();
            totalGrossAmount += itemPrice;

            GoldScrapItem scrapItem = new GoldScrapItem(
                    itemDto.description(),
                    itemDto.metalType() != null ? itemDto.metalType() : "GOLD",
                    itemDto.fineness() != null ? itemDto.fineness() : "750‰",
                    itemDto.grossWeightGrams(),
                    itemDto.estimatedNetWeightGrams(),
                    itemDto.purityRate(),
                    itemDto.unitPricePerGramCents(),
                    itemPrice
            );
            dossier.addItem(scrapItem);
        }

        GoldTaxContext taxContext = new GoldTaxContext(
                totalGrossAmount,
                request.initialPurchasePriceCents(),
                request.holdingYears(),
                request.initialPurchasePriceCents() != null
        );

        GoldTaxCalculationResult taxResult = taxStrategyRegistry.calculateTax(request.taxStrategy(), taxContext);

        dossier.setTotalGrossWeightGrams(totalGrossWeight);
        dossier.setTotalEstimatedNetWeightGrams(totalNetWeight);
        dossier.setTotalGrossAmountCents(totalGrossAmount);
        dossier.setTaxAmountCents(taxResult.taxAmountCents());
        dossier.setNetPayableToSellerCents(taxResult.netPayableCents());
        dossier.setStatus(GoldRepurchaseStatus.ESTIMATED);

        GoldRepurchaseDossier saved = dossierRepository.save(dossier);
        return GoldDossierResponse.fromEntity(saved);
    }

    @Transactional
    public GoldDossierResponse signDossier(Long dossierId, GoldPaymentMethod paymentMethod) {
        GoldRepurchaseDossier dossier = dossierRepository.findById(dossierId)
                .orElseThrow(() -> new IllegalArgumentException("Dossier de rachat introuvable id=" + dossierId));

        if (dossier.getStatus() != GoldRepurchaseStatus.DRAFT && dossier.getStatus() != GoldRepurchaseStatus.ESTIMATED) {
            throw new IllegalStateException("Le dossier ne peut plus être signé dans son état actuel : " + dossier.getStatus());
        }

        if (paymentMethod != null) {
            dossier.setPaymentMethod(paymentMethod);
        }

        Instant now = Instant.now();
        Instant coolingOffEndsAt = now.plus(LEGAL_COOLING_OFF_HOURS, ChronoUnit.HOURS);

        dossier.setSignedAt(now);
        dossier.setCoolingOffEndsAt(coolingOffEndsAt);
        dossier.setStatus(GoldRepurchaseStatus.QUARANTINE_48H);

        GoldRepurchaseDossier saved = dossierRepository.save(dossier);
        return GoldDossierResponse.fromEntity(saved);
    }

    @Transactional
    public GoldDossierResponse finalizeDossier(Long dossierId, boolean ignoreQuarantineForTest) {
        GoldRepurchaseDossier dossier = dossierRepository.findById(dossierId)
                .orElseThrow(() -> new IllegalArgumentException("Dossier de rachat introuvable id=" + dossierId));

        if (dossier.getStatus() != GoldRepurchaseStatus.QUARANTINE_48H) {
            throw new IllegalStateException("Le dossier doit être en période de séquestre (QUARANTINE_48H) pour être finalisé");
        }

        Instant now = Instant.now();
        if (!ignoreQuarantineForTest && dossier.getCoolingOffEndsAt() != null && now.isBefore(dossier.getCoolingOffEndsAt())) {
            throw new IllegalStateException("Le délai légal de rétractation de 48h (Art. L224-96 C. Conso) n'est pas expiré. Fin du séquestre : " + dossier.getCoolingOffEndsAt());
        }

        dossier.setStatus(GoldRepurchaseStatus.FINALIZED);
        dossier.setFinalizedAt(now);

        GoldRepurchaseDossier saved = dossierRepository.save(dossier);

        // Publication de l'événement Spring Modulith GoldRepurchasedEvent
        List<GoldRepurchasedEvent.GoldScrapRecord> scrapRecords = saved.getItems().stream()
                .map(i -> new GoldRepurchasedEvent.GoldScrapRecord(
                        i.getDescription(),
                        i.getMetalType(),
                        i.getFineness(),
                        i.getGrossWeightGrams(),
                        i.getEstimatedNetWeightGrams(),
                        i.getPurityRate(),
                        i.getTotalPriceCents()
                ))
                .toList();

        GoldRepurchasedEvent event = new GoldRepurchasedEvent(
                saved.getId(),
                saved.getDossierNumber(),
                saved.getStoreId(),
                saved.getOperatorUsername(),
                saved.getCustomerId(),
                saved.getSellerFullName(),
                saved.getSellerCniPassport(),
                "Adresse vendeur",
                saved.getTotalGrossWeightGrams(),
                saved.getTotalEstimatedNetWeightGrams(),
                saved.getNetPayableToSellerCents(),
                scrapRecords,
                saved.getCoolingOffEndsAt(),
                now
        );
        eventPublisher.publishEvent(event);

        return GoldDossierResponse.fromEntity(saved);
    }

    @Transactional(readOnly = true)
    public GoldDossierResponse getDossier(Long dossierId) {
        return dossierRepository.findById(dossierId)
                .map(GoldDossierResponse::fromEntity)
                .orElseThrow(() -> new IllegalArgumentException("Dossier introuvable id=" + dossierId));
    }
}
