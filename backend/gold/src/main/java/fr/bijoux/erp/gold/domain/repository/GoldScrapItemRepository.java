package fr.bijoux.erp.gold.domain.repository;

import fr.bijoux.erp.gold.domain.model.GoldScrapItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface GoldScrapItemRepository extends JpaRepository<GoldScrapItem, Long> {
    List<GoldScrapItem> findByDossierId(Long dossierId);
}
