package br.com.willianmendesf.system.repository;

import br.com.willianmendesf.system.model.entity.PrayerDistribution;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface PrayerDistributionRepository extends JpaRepository<PrayerDistribution, Long> {
    
    List<PrayerDistribution> findByDistributionDate(LocalDate date);
    
    List<PrayerDistribution> findByIntercessorId(Long intercessorId);
    
    List<PrayerDistribution> findByDistributionDateBetween(LocalDate startDate, LocalDate endDate);
    
    List<PrayerDistribution> findByStatus(PrayerDistribution.DistributionStatus status);
    
    @Query("SELECT d FROM PrayerDistribution d WHERE d.intercessor.id = :intercessorId ORDER BY d.distributionDate DESC")
    List<PrayerDistribution> findByIntercessorIdOrderByDateDesc(@Param("intercessorId") Long intercessorId);
    
    @Query("SELECT d FROM PrayerDistribution d WHERE d.distributionDate BETWEEN :startDate AND :endDate AND d.intercessor.id = :intercessorId")
    List<PrayerDistribution> findByIntercessorAndDateRange(@Param("intercessorId") Long intercessorId, 
                                                           @Param("startDate") LocalDate startDate, 
                                                           @Param("endDate") LocalDate endDate);
}

