package fr.bijoux.erp.weightaccount.domain.repository;

import fr.bijoux.erp.weightaccount.domain.model.WeightAccountLedger;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface WeightAccountLedgerRepository extends JpaRepository<WeightAccountLedger, Long> {

    Optional<WeightAccountLedger> findTopByStoreIdAndPartnerNameAndMetalTypeOrderByTimestampDescIdDesc(
            Long storeId, String partnerName, String metalType
    );

    List<WeightAccountLedger> findByStoreIdAndPartnerNameOrderByTimestampDesc(Long storeId, String partnerName);

    List<WeightAccountLedger> findByStoreIdOrderByTimestampDesc(Long storeId);
}
