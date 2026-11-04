package fr.bijoux.erp.pos.domain.repository;

import fr.bijoux.erp.pos.domain.model.PosTicketLine;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PosTicketLineRepository extends JpaRepository<PosTicketLine, Long> {
    List<PosTicketLine> findByTicketId(Long ticketId);
}
