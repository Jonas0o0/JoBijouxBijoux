package fr.bijoux.erp.crm.domain.repository;

import fr.bijoux.erp.crm.domain.model.Customer;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CustomerRepository extends JpaRepository<Customer, Long> {

    Optional<Customer> findByEmail(String email);

    Optional<Customer> findByCniPassportNumber(String cniPassportNumber);

    @Query("SELECT c FROM Customer c WHERE LOWER(c.lastName) LIKE LOWER(CONCAT('%', :q, '%')) OR LOWER(c.firstName) LIKE LOWER(CONCAT('%', :q, '%')) ORDER BY c.lastName ASC, c.firstName ASC")
    List<Customer> searchByName(@Param("q") String query);
}
