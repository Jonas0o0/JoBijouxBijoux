package fr.bijoux.erp.catalog.domain.repository;

import fr.bijoux.erp.catalog.domain.model.SupplierOrder;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface SupplierOrderRepository extends JpaRepository<SupplierOrder, Long> {

    Optional<SupplierOrder> findByOrderNumber(String orderNumber);

    List<SupplierOrder> findByStoreIdOrderByCreatedAtDesc(Long storeId);

    @Query("SELECT COUNT(o) FROM SupplierOrder o WHERE o.storeId = :storeId")
    long countByStoreId(@Param("storeId") Long storeId);
}
