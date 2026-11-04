package fr.bijoux.erp.catalog.domain.repository;

import fr.bijoux.erp.catalog.domain.model.InventoryMovement;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface InventoryMovementRepository extends JpaRepository<InventoryMovement, Long> {

    List<InventoryMovement> findByJewelryItemIdOrderByTimestampDesc(Long jewelryItemId);

    Page<InventoryMovement> findByJewelryItemId(Long jewelryItemId, Pageable pageable);
}
