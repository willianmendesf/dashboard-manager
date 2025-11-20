package br.com.willianmendesf.system.repository;

import br.com.willianmendesf.system.model.entity.EventEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface EventRepository extends JpaRepository<EventEntity, Long> {
    
    List<EventEntity> findByDate(LocalDate date);
    
    @Query("SELECT e FROM EventEntity e WHERE e.date BETWEEN :startDate AND :endDate ORDER BY e.date ASC, e.startTime ASC")
    List<EventEntity> findByDateBetween(@Param("startDate") LocalDate startDate, @Param("endDate") LocalDate endDate);
}

