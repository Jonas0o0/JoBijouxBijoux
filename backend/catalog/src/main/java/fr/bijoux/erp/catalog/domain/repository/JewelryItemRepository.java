package fr.bijoux.erp.catalog.domain.repository;

import fr.bijoux.erp.catalog.domain.model.JewelryItem;
import fr.bijoux.erp.catalog.domain.model.JewelryItemStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface JewelryItemRepository extends JpaRepository<JewelryItem, Long> {

    Optional<JewelryItem> findBySerialNumber(String serialNumber);

    boolean existsBySerialNumber(String serialNumber);

    List<JewelryItem> findByStoreIdAndStatus(Long storeId, JewelryItemStatus status);

    List<JewelryItem> findByStorageLocationId(Long storageLocationId);

    Page<JewelryItem> findByStoreId(Long storeId, Pageable pageable);
}
