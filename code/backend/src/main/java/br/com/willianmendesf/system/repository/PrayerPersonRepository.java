package br.com.willianmendesf.system.repository;

import br.com.willianmendesf.system.model.entity.PrayerPerson;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PrayerPersonRepository extends JpaRepository<PrayerPerson, Long> {
    
    List<PrayerPerson> findByIsIntercessor(Boolean isIntercessor);
    
    List<PrayerPerson> findByIsExternal(Boolean isExternal);
    
    List<PrayerPerson> findByTipo(PrayerPerson.PersonType tipo);
    
    List<PrayerPerson> findByActive(Boolean active);
    
    Optional<PrayerPerson> findByMemberId(Long memberId);
    
    List<PrayerPerson> findByNomeContainingIgnoreCase(String nome);
    
    Optional<PrayerPerson> findByCelular(String celular);
    
    List<PrayerPerson> findByActiveAndIsIntercessor(Boolean active, Boolean isIntercessor);
    
    @Query("SELECT p FROM PrayerPerson p WHERE p.active = true AND p.isIntercessor = true")
    List<PrayerPerson> findActiveIntercessors();
    
    @Query("SELECT p FROM PrayerPerson p WHERE p.active = true AND (p.isIntercessor = false OR p.isIntercessor IS NULL)")
    List<PrayerPerson> findActiveCandidates();
    
    @Query("SELECT p FROM PrayerPerson p WHERE p.active = true")
    List<PrayerPerson> findAllActive();
}

