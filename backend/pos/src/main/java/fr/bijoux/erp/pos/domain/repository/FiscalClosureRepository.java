package fr.bijoux.erp.pos.domain.repository;

import fr.bijoux.erp.pos.domain.model.FiscalClosure;
import fr.bijoux.erp.pos.domain.model.FiscalClosureType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface FiscalClosureRepository extends JpaRepository<FiscalClosure, Long> {

    Optional<FiscalClosure> findTopByStoreIdAndClosureTypeOrderBySequenceNumberDesc(Long storeId, FiscalClosureType closureType);

    Optional<FiscalClosure> findTopByStoreIdOrderByCreatedAtDescIdDesc(Long storeId);

    @Query("SELECT COALESCE(MAX(f.sequenceNumber), 0) FROM FiscalClosure f WHERE f.storeId = :storeId AND f.closureType = :closureType")
    long findMaxSequenceNumber(@Param("storeId") Long storeId, @Param("closureType") FiscalClosureType closureType);
}
