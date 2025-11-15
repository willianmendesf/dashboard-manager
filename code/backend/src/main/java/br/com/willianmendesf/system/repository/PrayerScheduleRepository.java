package br.com.willianmendesf.system.repository;

import br.com.willianmendesf.system.model.entity.PrayerSchedule;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface PrayerScheduleRepository extends JpaRepository<PrayerSchedule, Long> {
    
    List<PrayerSchedule> findByEnabled(Boolean enabled);
    
    @Query("SELECT s FROM PrayerSchedule s WHERE s.enabled = true AND s.proximaExecucao <= :now ORDER BY s.proximaExecucao ASC")
    List<PrayerSchedule> findDueSchedules(@Param("now") LocalDateTime now);
    
    @Query("SELECT s FROM PrayerSchedule s WHERE s.enabled = true ORDER BY s.proximaExecucao ASC")
    List<PrayerSchedule> findAllEnabledOrdered();
}

