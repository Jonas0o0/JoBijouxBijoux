package fr.bijoux.erp.crm.domain.repository;

import fr.bijoux.erp.crm.domain.model.CustomerMeasurement;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CustomerMeasurementRepository extends JpaRepository<CustomerMeasurement, Long> {
    List<CustomerMeasurement> findByCustomerIdOrderByRecordedAtDesc(Long customerId);
}
