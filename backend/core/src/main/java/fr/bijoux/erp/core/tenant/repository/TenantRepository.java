package fr.bijoux.erp.core.tenant.repository;

import fr.bijoux.erp.core.tenant.model.Tenant;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface TenantRepository extends JpaRepository<Tenant, Long> {
    Optional<Tenant> findByCode(String code);
    Optional<Tenant> findByCodeAndActiveTrue(String code);
    List<Tenant> findByActiveTrue();
    boolean existsByCode(String code);
}
