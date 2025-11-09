package br.com.willianmendesf.system.repository;

import br.com.willianmendesf.system.model.entity.SystemConfiguration;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface SystemConfigurationRepository extends JpaRepository<SystemConfiguration, Long> {
    Optional<SystemConfiguration> findByKey(String key);
    boolean existsByKey(String key);
}

