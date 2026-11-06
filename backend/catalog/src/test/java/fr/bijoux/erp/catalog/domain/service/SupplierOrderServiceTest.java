package fr.bijoux.erp.catalog.domain.service;

import fr.bijoux.erp.catalog.domain.model.*;
import fr.bijoux.erp.catalog.domain.repository.InventoryMovementRepository;
import fr.bijoux.erp.catalog.domain.repository.JewelryItemRepository;
import fr.bijoux.erp.catalog.domain.repository.StorageLocationRepository;
import fr.bijoux.erp.catalog.domain.repository.SupplierOrderRepository;
import fr.bijoux.erp.catalog.dto.OrderItemDto;
import fr.bijoux.erp.catalog.dto.SupplierOrderResponse;
import fr.bijoux.erp.core.domain.valueobject.GoldFineness;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("Tests Unitaires - SupplierOrderService & Réassort Fournisseur HBJO")
class SupplierOrderServiceTest {

    @Mock
    private SupplierOrderRepository supplierOrderRepository;

    @Mock
    private JewelryItemRepository jewelryItemRepository;

    @Mock
    private StorageLocationRepository storageLocationRepository;

    @Mock
    private InventoryMovementRepository inventoryMovementRepository;

    private SupplierOrderService supplierOrderService;

    @BeforeEach
    void setUp() {
        supplierOrderService = new SupplierOrderService(
                supplierOrderRepository,
                jewelryItemRepository,
                storageLocationRepository,
                inventoryMovementRepository
        );
    }

    @Test
    @DisplayName("Doit créer une commande d'achat fournisseur avec calcul automatique des totaux HT / TVA / TTC")
    void shouldCreateSupplierOrderWithCalculatedTotals() {
        when(supplierOrderRepository.countByStoreId(1L)).thenReturn(0L);
        when(supplierOrderRepository.save(any(SupplierOrder.class))).thenAnswer(inv -> {
            SupplierOrder o = inv.getArgument(0);
            o.setId(10L);
            return o;
        });

        List<OrderItemDto> items = List.of(
                new OrderItemDto("REF-BAG-001", "Bague Or 750 Saphir", 2, 25_000L), // 2 * 250€ = 500€
                new OrderItemDto("REF-COL-002", "Collier Diamant 0.5ct", 1, 50_000L) // 1 * 500€ = 500€
        );

        SupplierOrderResponse response = supplierOrderService.createOrder(1L, "Fournisseur Joaillerie de France", items);

        assertThat(response.id()).isEqualTo(10L);
        assertThat(response.orderNumber()).isEqualTo("SUP-1-000001");
        assertThat(response.supplierName()).isEqualTo("Fournisseur Joaillerie de France");
        assertThat(response.status()).isEqualTo(SupplierOrderStatus.COMMANDE);
        assertThat(response.totalAmountHtCents()).isEqualTo(100_000L); // 1000 € HT
        assertThat(response.totalVatCents()).isEqualTo(20_000L);     // 200 € TVA 20%
        assertThat(response.totalAmountTtcCents()).isEqualTo(120_000L); // 1200 € TTC
        assertThat(response.items()).hasSize(2);
    }

    @Test
    @DisplayName("Doit réceptionner une commande vers la VITRINE, générer les pièces sérialisées et tracer le mouvement")
    void shouldReceiveSupplierOrderInVitrine() {
        SupplierOrder order = new SupplierOrder("SUP-1-000001", 1L, "Diamantaire Anvers");
        order.setId(20L);

        SupplierOrderItem item = new SupplierOrderItem(
                "REF-DIA-01",
                "Solitaire Diamant 0.3ct",
                2,
                40_000L,
                GoldFineness.OR_750,
                new BigDecimal("3.200"),
                90_000L,
                VatRegime.STANDARD_20
        );
        item.setId(100L);
        order.addItem(item);
        order.recalculateTotals();

        when(supplierOrderRepository.findById(20L)).thenReturn(Optional.of(order));
        when(supplierOrderRepository.save(any(SupplierOrder.class))).thenAnswer(inv -> inv.getArgument(0));

        StorageLocation vitrineLoc = new StorageLocation(1L, "VIT-01", "Vitrine Principale", StorageLocationType.VITRINE);
        vitrineLoc.setId(101L);
        when(storageLocationRepository.findByStoreIdAndLocationType(1L, StorageLocationType.VITRINE))
                .thenReturn(List.of(vitrineLoc));

        when(jewelryItemRepository.save(any(JewelryItem.class))).thenAnswer(inv -> inv.getArgument(0));
        when(inventoryMovementRepository.save(any(InventoryMovement.class))).thenAnswer(inv -> inv.getArgument(0));

        SupplierOrderResponse response = supplierOrderService.receiveOrder(20L, "VITRINE");

        assertThat(response.status()).isEqualTo(SupplierOrderStatus.RECEPTIONNE);
        assertThat(response.destinationStock()).isEqualTo("VITRINE");
        assertThat(response.receivedAt()).isNotNull();

        // Vérification de la création de 2 bijoux unitaires en vitrine
        ArgumentCaptor<JewelryItem> itemCaptor = ArgumentCaptor.forClass(JewelryItem.class);
        verify(jewelryItemRepository, times(2)).save(itemCaptor.capture());
        List<JewelryItem> createdItems = itemCaptor.getAllValues();
        assertThat(createdItems).hasSize(2);
        for (JewelryItem ji : createdItems) {
            assertThat(ji.getStatus()).isEqualTo(JewelryItemStatus.EN_VITRINE);
            assertThat(ji.getStorageLocation()).isEqualTo(vitrineLoc);
            assertThat(ji.getReferenceNumber()).isEqualTo("REF-DIA-01");
            assertThat(ji.getSellingPriceTtcCents()).isEqualTo(90_000L);
        }

        // Vérification des mouvements d'inventaire
        ArgumentCaptor<InventoryMovement> movCaptor = ArgumentCaptor.forClass(InventoryMovement.class);
        verify(inventoryMovementRepository, times(2)).save(movCaptor.capture());
        for (InventoryMovement mov : movCaptor.getAllValues()) {
            assertThat(mov.getMovementType()).isEqualTo(MovementType.ENTREE_STOCK);
            assertThat(mov.getToLocation()).isEqualTo(vitrineLoc);
            assertThat(mov.getPerformedBy()).contains("Diamantaire Anvers");
        }
    }

    @Test
    @DisplayName("Doit réceptionner une commande vers le COFFRE et assigner le statut AU_COFFRE")
    void shouldReceiveSupplierOrderInCoffre() {
        SupplierOrder order = new SupplierOrder("SUP-1-000002", 1L, "Fonderie Lyon");
        order.setId(30L);

        SupplierOrderItem item = new SupplierOrderItem(
                "REF-LINGOT-01",
                "Lingotin Or 10g",
                1,
                75_000L,
                GoldFineness.OR_999,
                new BigDecimal("10.000"),
                85_000L,
                VatRegime.STANDARD_20
        );
        item.setId(200L);
        order.addItem(item);
        order.recalculateTotals();

        when(supplierOrderRepository.findById(30L)).thenReturn(Optional.of(order));
        when(supplierOrderRepository.save(any(SupplierOrder.class))).thenAnswer(inv -> inv.getArgument(0));

        StorageLocation coffreLoc = new StorageLocation(1L, "COF-01", "Coffre Blindé", StorageLocationType.COFFRE_FORT);
        coffreLoc.setId(102L);
        when(storageLocationRepository.findByStoreIdAndLocationType(1L, StorageLocationType.COFFRE_FORT))
                .thenReturn(List.of(coffreLoc));

        when(jewelryItemRepository.save(any(JewelryItem.class))).thenAnswer(inv -> inv.getArgument(0));
        when(inventoryMovementRepository.save(any(InventoryMovement.class))).thenAnswer(inv -> inv.getArgument(0));

        SupplierOrderResponse response = supplierOrderService.receiveOrder(30L, "COFFRE");

        assertThat(response.status()).isEqualTo(SupplierOrderStatus.RECEPTIONNE);
        assertThat(response.destinationStock()).isEqualTo("COFFRE");

        ArgumentCaptor<JewelryItem> itemCaptor = ArgumentCaptor.forClass(JewelryItem.class);
        verify(jewelryItemRepository, times(1)).save(itemCaptor.capture());
        JewelryItem created = itemCaptor.getValue();
        assertThat(created.getStatus()).isEqualTo(JewelryItemStatus.AU_COFFRE);
        assertThat(created.getStorageLocation()).isEqualTo(coffreLoc);
    }

    @Test
    @DisplayName("Doit refuser de réceptionner une commande déjà réceptionnée")
    void shouldRejectReceiveIfAlreadyReceived() {
        SupplierOrder order = new SupplierOrder("SUP-1-000003", 1L, "Fournisseur A");
        order.setId(40L);
        order.setStatus(SupplierOrderStatus.RECEPTIONNE);

        when(supplierOrderRepository.findById(40L)).thenReturn(Optional.of(order));

        assertThatThrownBy(() -> supplierOrderService.receiveOrder(40L, "VITRINE"))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("déjà été entièrement réceptionnée");
    }

    @Test
    @DisplayName("Doit refuser un emplacement inconnu lors de la réception")
    void shouldRejectInvalidDestinationStock() {
        SupplierOrder order = new SupplierOrder("SUP-1-000004", 1L, "Fournisseur B");
        order.setId(50L);

        when(supplierOrderRepository.findById(50L)).thenReturn(Optional.of(order));

        assertThatThrownBy(() -> supplierOrderService.receiveOrder(50L, "HANGAR_INCONNU"))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Emplacement de destination non reconnu");
    }
}
