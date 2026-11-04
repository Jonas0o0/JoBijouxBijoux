package fr.bijoux.erp.pos.domain.repository;

import fr.bijoux.erp.pos.domain.model.PosTicket;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

@Repository
public interface PosTicketRepository extends JpaRepository<PosTicket, Long> {

    Optional<PosTicket> findByTicketNumber(String ticketNumber);

    Optional<PosTicket> findTopByStoreIdOrderByCreatedAtDescIdDesc(Long storeId);

    @Query("SELECT t FROM PosTicket t WHERE t.storeId = :storeId AND t.createdAt >= :startDate AND t.createdAt < :endDate AND t.status = 'COMPLETED'")
    List<PosTicket> findCompletedTicketsBetween(
            @Param("storeId") Long storeId,
            @Param("startDate") Instant startDate,
            @Param("endDate") Instant endDate
    );

    @Query("SELECT COUNT(t) FROM PosTicket t WHERE t.storeId = :storeId")
    long countByStoreId(@Param("storeId") Long storeId);
}
