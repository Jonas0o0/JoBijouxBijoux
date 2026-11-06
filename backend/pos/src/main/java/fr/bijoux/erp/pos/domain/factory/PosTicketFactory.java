package fr.bijoux.erp.pos.domain.factory;

import fr.bijoux.erp.catalog.domain.model.VatRegime;
import fr.bijoux.erp.pos.domain.model.PosItemType;
import fr.bijoux.erp.pos.domain.model.PosTicket;
import fr.bijoux.erp.pos.domain.model.PosTicketLine;
import fr.bijoux.erp.pos.domain.service.VatCalculationService;
import org.springframework.stereotype.Component;

import java.util.List;

/**
 * Factory Pattern pour la création et la cohérence fiscale des tickets de caisse.
 */
@Component
public class PosTicketFactory {

    private final VatCalculationService vatCalculationService;

    public PosTicketFactory(VatCalculationService vatCalculationService) {
        this.vatCalculationService = vatCalculationService;
    }

    public record LineBlueprint(
            int lineNumber,
            PosItemType itemType,
            Long jewelryItemId,
            Long repairOrderId,
            String designation,
            int quantity,
            long unitPriceTtcCents,
            VatRegime vatRegime,
            Long purchasePriceHtCents
    ) {
        public LineBlueprint(int lineNumber,
                             PosItemType itemType,
                             Long jewelryItemId,
                             String designation,
                             int quantity,
                             long unitPriceTtcCents,
                             VatRegime vatRegime,
                             Long purchasePriceHtCents) {
            this(lineNumber, itemType, jewelryItemId, null, designation, quantity, unitPriceTtcCents, vatRegime, purchasePriceHtCents);
        }
    }

    public PosTicket createTicket(
            String ticketNumber,
            Long storeId,
            String operatorUsername,
            Long customerId,
            List<LineBlueprint> lineBlueprints,
            String previousHash,
            String currentHash,
            String signature
    ) {
        long totalTtc = 0L;
        long totalHt = 0L;
        long totalVat = 0L;

        PosTicket ticket = new PosTicket(
                ticketNumber,
                storeId,
                operatorUsername,
                customerId,
                0L,
                0L,
                0L,
                previousHash,
                currentHash,
                signature
        );

        for (LineBlueprint bp : lineBlueprints) {
            long lineTotalTtc = bp.unitPriceTtcCents() * bp.quantity();
            VatRegime regime = bp.vatRegime() != null ? bp.vatRegime() : VatRegime.STANDARD_20;
            var vatRes = vatCalculationService.calculateVat(lineTotalTtc, regime, bp.purchasePriceHtCents());

            PosTicketLine line = new PosTicketLine(
                    bp.lineNumber(),
                    bp.itemType() != null ? bp.itemType() : PosItemType.CATALOG_ITEM,
                    bp.jewelryItemId(),
                    bp.repairOrderId(),
                    bp.designation(),
                    bp.quantity(),
                    bp.unitPriceTtcCents(),
                    lineTotalTtc,
                    vatRes.vatRate(),
                    regime,
                    vatRes.vatAmountCents()
            );

            ticket.addLine(line);

            totalTtc += lineTotalTtc;
            totalHt += vatRes.totalHtCents();
            totalVat += vatRes.vatAmountCents();
        }

        ticket.setTotalTtcCents(totalTtc);
        ticket.setTotalHtCents(totalHt);
        ticket.setTotalVatCents(totalVat);

        return ticket;
    }
}
