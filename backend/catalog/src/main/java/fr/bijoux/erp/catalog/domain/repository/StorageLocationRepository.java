package fr.bijoux.erp.catalog.domain.repository;

import fr.bijoux.erp.catalog.domain.model.StorageLocation;
import fr.bijoux.erp.catalog.domain.model.StorageLocationType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface StorageLocationRepository extends JpaRepository<StorageLocation, Long> {

    Optional<StorageLocation> findByStoreIdAndCode(Long storeId, String code);

    List<StorageLocation> findByStoreIdAndActiveTrue(Long storeId);

    List<StorageLocation> findByStoreIdAndLocationType(Long storeId, StorageLocationType locationType);
}
