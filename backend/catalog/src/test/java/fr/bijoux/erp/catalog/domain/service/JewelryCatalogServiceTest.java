package fr.bijoux.erp.catalog.domain.service;

import fr.bijoux.erp.catalog.domain.model.*;
import fr.bijoux.erp.catalog.domain.repository.InventoryMovementRepository;
import fr.bijoux.erp.catalog.domain.repository.JewelryItemRepository;
import fr.bijoux.erp.catalog.domain.repository.StorageLocationRepository;
import fr.bijoux.erp.core.domain.valueobject.GoldFineness;
import fr.bijoux.erp.core.domain.valueobject.MoneyAmount;
import fr.bijoux.erp.core.domain.valueobject.WeightInGrams;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("Tests unitaires du service de stock unitaire JewelryCatalogService")
class JewelryCatalogServiceTest {

    @Mock
    private JewelryItemRepository jewelryItemRepository;

    @Mock
    private StorageLocationRepository storageLocationRepository;

    @Mock
    private InventoryMovementRepository inventoryMovementRepository;

    @InjectMocks
    private JewelryCatalogService jewelryCatalogService;

    private StorageLocation vitrine;
    private StorageLocation coffre;

    @BeforeEach
    void setUp() {
        vitrine = new StorageLocation(1L, "VIT-01", "Vitrine Façade", StorageLocationType.VITRINE);
        vitrine.setId(10L);

        coffre = new StorageLocation(1L, "COF-01", "Coffre-fort Principal", StorageLocationType.COFFRE_FORT);
        coffre.setId(20L);
    }

    @Test
    @DisplayName("Doit créer un bijou sérialisé et tracer l'entrée en stock")
    void shouldCreateJewelryItemAndLogMovement() {
        when(jewelryItemRepository.existsBySerialNumber("BIJ-2026-001")).thenReturn(false);
        when(storageLocationRepository.findById(10L)).thenReturn(Optional.of(vitrine));
        when(jewelryItemRepository.save(any(JewelryItem.class))).thenAnswer(invocation -> invocation.getArgument(0));

        JewelryItem item = jewelryCatalogService.createJewelryItem(
                "BIJ-2026-001",
                "REF-SOL-750",
                "Solitaire Diamant 0.50ct Or 18K",
                GoldFineness.OR_750,
                WeightInGrams.of("3.800"),
                WeightInGrams.of("3.700"),
                MoneyAmount.ofCents(250000), // 2 500,00 € TTC
                MoneyAmount.ofCents(120000), // 1 200,00 € HT
                VatRegime.STANDARD_20,
                1L,
                10L,
                "vendeur.paris"
        );

        assertThat(item).isNotNull();
        assertThat(item.getSerialNumber()).isEqualTo("BIJ-2026-001");
        assertThat(item.getStatus()).isEqualTo(JewelryItemStatus.EN_VITRINE);
        assertThat(item.calculateFineWeight().value()).isEqualByComparingTo(new BigDecimal("2.850")); // 3.800 * 750 / 1000

        verify(inventoryMovementRepository, times(1)).save(any(InventoryMovement.class));
    }

    @Test
    @DisplayName("Doit refuser la création avec un numéro de série dupliqué")
    void shouldRejectDuplicateSerialNumber() {
        when(jewelryItemRepository.existsBySerialNumber("BIJ-DUPLICATE")).thenReturn(true);

        assertThatThrownBy(() -> jewelryCatalogService.createJewelryItem(
                "BIJ-DUPLICATE",
                "REF-01",
                "Bague",
                GoldFineness.OR_750,
                WeightInGrams.of("2.000"),
                null,
                MoneyAmount.ofCents(50000),
                MoneyAmount.ofCents(25000),
                VatRegime.STANDARD_20,
                1L,
                null,
                "admin"
        )).isInstanceOf(IllegalArgumentException.class)
          .hasMessageContaining("existe déjà");
    }

    @Test
    @DisplayName("Doit déplacer une pièce vers le coffre et adapter son statut")
    void shouldMoveItemToSafe() {
        JewelryItem item = new JewelryItem(
                "BIJ-2026-002",
                "REF-COLLIER",
                "Collier Or 18K",
                GoldFineness.OR_750,
                WeightInGrams.of("15.000"),
                MoneyAmount.ofCents(180000),
                MoneyAmount.ofCents(90000),
                VatRegime.STANDARD_20,
                1L
        );
        item.setId(100L);
        item.setStorageLocation(vitrine);
        item.setStatus(JewelryItemStatus.EN_VITRINE);

        when(jewelryItemRepository.findById(100L)).thenReturn(Optional.of(item));
        when(storageLocationRepository.findById(20L)).thenReturn(Optional.of(coffre));
        when(jewelryItemRepository.save(any(JewelryItem.class))).thenAnswer(i -> i.getArgument(0));

        JewelryItem moved = jewelryCatalogService.moveToLocation(100L, 20L, "gerant.paris", "Fermeture boutique");

        assertThat(moved.getStatus()).isEqualTo(JewelryItemStatus.AU_COFFRE);
        assertThat(moved.getStorageLocation()).isEqualTo(coffre);

        ArgumentCaptor<InventoryMovement> captor = ArgumentCaptor.forClass(InventoryMovement.class);
        verify(inventoryMovementRepository).save(captor.capture());
        assertThat(captor.getValue().getMovementType()).isEqualTo(MovementType.TRANSFERT_EMPLACEMENT);
    }
}
