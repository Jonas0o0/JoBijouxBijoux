package fr.bijoux.erp.workshop.domain.repository;

import fr.bijoux.erp.workshop.domain.model.RepairOrder;
import fr.bijoux.erp.workshop.domain.model.WorkshopStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface RepairOrderRepository extends JpaRepository<RepairOrder, Long> {

    Optional<RepairOrder> findByOrderNumber(String orderNumber);

    List<RepairOrder> findByStoreIdOrderByCreatedAtDesc(Long storeId);

    List<RepairOrder> findByStoreIdAndStatus(Long storeId, WorkshopStatus status);

    List<RepairOrder> findByAssignedArtisanUsername(String assignedArtisanUsername);

    @Query("SELECT COUNT(r) FROM RepairOrder r WHERE r.storeId = :storeId")
    long countByStoreId(@Param("storeId") Long storeId);
}
