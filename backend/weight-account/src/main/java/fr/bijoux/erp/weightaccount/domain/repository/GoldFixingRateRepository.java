package fr.bijoux.erp.weightaccount.domain.repository;

import fr.bijoux.erp.weightaccount.domain.model.GoldFixingRate;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface GoldFixingRateRepository extends JpaRepository<GoldFixingRate, Long> {

    Optional<GoldFixingRate> findTopByMetalTypeOrderByFixingTimestampDesc(String metalType);
}
