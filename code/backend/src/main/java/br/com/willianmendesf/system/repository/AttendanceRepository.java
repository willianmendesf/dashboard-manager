package br.com.willianmendesf.system.repository;

import br.com.willianmendesf.system.model.entity.AttendanceEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Repository
public interface AttendanceRepository extends JpaRepository<AttendanceEntity, Long> {
    
    boolean existsByMemberIdAndEventId(Long memberId, Long eventId);
    
    @Modifying
    @Transactional
    void deleteByMemberIdAndEventId(Long memberId, Long eventId);
    
    List<AttendanceEntity> findByEventId(Long eventId);
    
    Optional<AttendanceEntity> findByMemberIdAndEventId(Long memberId, Long eventId);
    
    @Query("SELECT COUNT(a) FROM AttendanceEntity a WHERE a.event.id = :eventId")
    Long countByEventId(@Param("eventId") Long eventId);
    
    @Query("SELECT COUNT(DISTINCT a.event.id) FROM AttendanceEntity a WHERE a.event.date BETWEEN :startDate AND :endDate")
    Long countDistinctEventsByDateRange(@Param("startDate") java.time.LocalDate startDate, 
                                        @Param("endDate") java.time.LocalDate endDate);
    
    @Query("SELECT COUNT(a) FROM AttendanceEntity a WHERE a.event.date BETWEEN :startDate AND :endDate")
    Long countByDateRange(@Param("startDate") java.time.LocalDate startDate, 
                          @Param("endDate") java.time.LocalDate endDate);
}

