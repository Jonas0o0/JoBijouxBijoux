package fr.bijoux.erp.gold.domain.repository;

import fr.bijoux.erp.gold.domain.model.GoldRepurchaseDossier;
import fr.bijoux.erp.gold.domain.model.GoldRepurchaseStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface GoldRepurchaseDossierRepository extends JpaRepository<GoldRepurchaseDossier, Long> {

    Optional<GoldRepurchaseDossier> findByDossierNumber(String dossierNumber);

    List<GoldRepurchaseDossier> findByStoreIdOrderByCreatedAtDesc(Long storeId);

    List<GoldRepurchaseDossier> findByStoreIdAndStatus(Long storeId, GoldRepurchaseStatus status);

    @Query("SELECT COUNT(d) FROM GoldRepurchaseDossier d WHERE d.storeId = :storeId")
    long countByStoreId(@Param("storeId") Long storeId);
}
