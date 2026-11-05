package fr.bijoux.erp.workshop.domain.repository;

import fr.bijoux.erp.workshop.domain.model.CustomManufacturingOrder;
import fr.bijoux.erp.workshop.domain.model.WorkshopStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CustomManufacturingOrderRepository extends JpaRepository<CustomManufacturingOrder, Long> {

    Optional<CustomManufacturingOrder> findByOrderNumber(String orderNumber);

    List<CustomManufacturingOrder> findByStoreIdOrderByCreatedAtDesc(Long storeId);

    List<CustomManufacturingOrder> findByStoreIdAndStatus(Long storeId, WorkshopStatus status);

    @Query("SELECT COUNT(c) FROM CustomManufacturingOrder c WHERE c.storeId = :storeId")
    long countByStoreId(@Param("storeId") Long storeId);
}
