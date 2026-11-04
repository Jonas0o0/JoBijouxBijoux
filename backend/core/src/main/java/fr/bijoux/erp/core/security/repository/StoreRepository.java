package fr.bijoux.erp.core.security.repository;

import fr.bijoux.erp.core.security.model.Store;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface StoreRepository extends JpaRepository<Store, Long> {
    Optional<Store> findByCode(String code);
    boolean existsByCode(String code);
}
