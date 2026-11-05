package fr.bijoux.erp.workshop.domain.repository;

import fr.bijoux.erp.workshop.domain.model.WorkshopComponent;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface WorkshopComponentRepository extends JpaRepository<WorkshopComponent, Long> {
    List<WorkshopComponent> findByRepairOrderId(Long repairOrderId);
    List<WorkshopComponent> findByCustomOrderId(Long customOrderId);
}
