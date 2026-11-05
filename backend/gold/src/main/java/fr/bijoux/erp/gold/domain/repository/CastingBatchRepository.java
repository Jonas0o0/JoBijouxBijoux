package fr.bijoux.erp.gold.domain.repository;

import fr.bijoux.erp.gold.domain.model.CastingBatch;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface CastingBatchRepository extends JpaRepository<CastingBatch, Long> {
    Optional<CastingBatch> findByBatchNumber(String batchNumber);
}
