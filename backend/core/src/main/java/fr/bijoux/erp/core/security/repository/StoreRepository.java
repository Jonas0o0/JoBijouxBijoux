package fr.bijoux.erp.core.security.repository;

import fr.bijoux.erp.core.security.model.Store;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface StoreRepository extends JpaRepository<Store, Long> {
    Optional<Store> findByCode(String code);
    boolean existsByCode(String code);

    @Query("SELECT s FROM Store s LEFT JOIN FETCH s.tenant WHERE s.tenant.id = :tenantId")
    List<Store> findByTenantId(@Param("tenantId") Long tenantId);

    @Query("SELECT s FROM Store s LEFT JOIN FETCH s.tenant WHERE s.tenant.id = :tenantId AND s.active = true")
    List<Store> findByTenantIdAndActiveTrue(@Param("tenantId") Long tenantId);

    @Query("SELECT s FROM Store s LEFT JOIN FETCH s.tenant WHERE s.tenant.code = :tenantCode")
    List<Store> findByTenantCode(@Param("tenantCode") String tenantCode);

    @Query("SELECT s FROM Store s LEFT JOIN FETCH s.tenant WHERE s.tenant.code = :tenantCode AND s.active = true")
    List<Store> findByTenantCodeAndActiveTrue(@Param("tenantCode") String tenantCode);
}
