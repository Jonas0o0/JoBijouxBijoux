package fr.bijoux.erp.police.domain.repository;

import fr.bijoux.erp.police.domain.model.PoliceBookEntry;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

@Repository
public interface PoliceBookRepository extends JpaRepository<PoliceBookEntry, Long> {

    Optional<PoliceBookEntry> findTopByStoreIdOrderBySequenceNumberDesc(Long storeId);

    @Query("SELECT COALESCE(MAX(p.sequenceNumber), 0) FROM PoliceBookEntry p WHERE p.storeId = :storeId")
    long findMaxSequenceNumber(@Param("storeId") Long storeId);

    @Query("SELECT p FROM PoliceBookEntry p WHERE p.storeId = :storeId AND p.entryDate >= :startDate AND p.entryDate <= :endDate ORDER BY p.sequenceNumber ASC")
    List<PoliceBookEntry> findByPeriod(
            @Param("storeId") Long storeId,
            @Param("startDate") Instant startDate,
            @Param("endDate") Instant endDate
    );

    List<PoliceBookEntry> findByStoreIdOrderBySequenceNumberAsc(Long storeId);

    Optional<PoliceBookEntry> findByStoreIdAndSequenceNumber(Long storeId, Long sequenceNumber);

    List<PoliceBookEntry> findByExitTicketNumberIsNullAndStoreId(Long storeId);
}
