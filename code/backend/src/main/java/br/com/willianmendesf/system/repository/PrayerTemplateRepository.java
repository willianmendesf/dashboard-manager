package br.com.willianmendesf.system.repository;

import br.com.willianmendesf.system.model.entity.PrayerTemplate;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PrayerTemplateRepository extends JpaRepository<PrayerTemplate, Long> {
    
    List<PrayerTemplate> findByIsDefault(Boolean isDefault);
    
    List<PrayerTemplate> findByActive(Boolean active);
    
    Optional<PrayerTemplate> findByIsDefaultTrue();
    
    @Query("SELECT t FROM PrayerTemplate t WHERE t.active = true ORDER BY t.isDefault DESC, t.name ASC")
    List<PrayerTemplate> findAllActiveOrdered();
}

