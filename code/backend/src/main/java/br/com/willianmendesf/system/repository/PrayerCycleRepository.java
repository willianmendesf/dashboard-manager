package br.com.willianmendesf.system.repository;

import br.com.willianmendesf.system.model.entity.PrayerCycle;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PrayerCycleRepository extends JpaRepository<PrayerCycle, Long> {
    
    List<PrayerCycle> findByIntercessorId(Long intercessorId);
    
    List<PrayerCycle> findByCycleType(PrayerCycle.CycleType cycleType);
    
    List<PrayerCycle> findByIntercessorIdAndCycleType(Long intercessorId, PrayerCycle.CycleType cycleType);
    
    @Query("SELECT c FROM PrayerCycle c WHERE c.intercessor.id = :intercessorId ORDER BY c.completionDate DESC")
    List<PrayerCycle> findByIntercessorIdOrderByDateDesc(@Param("intercessorId") Long intercessorId);
}

