package fr.bijoux.erp.core.audit.repository;

import fr.bijoux.erp.core.audit.model.JetAuditLog;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface JetAuditLogRepository extends JpaRepository<JetAuditLog, Long> {

    Optional<JetAuditLog> findTopByOrderBySequenceNumberDesc();

    Page<JetAuditLog> findByPrincipalOrderByTimestampDesc(String principal, Pageable pageable);

    Page<JetAuditLog> findByStoreIdOrderByTimestampDesc(Long storeId, Pageable pageable);
}
