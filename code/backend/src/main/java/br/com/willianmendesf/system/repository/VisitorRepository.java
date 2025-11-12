package br.com.willianmendesf.system.repository;

import br.com.willianmendesf.system.model.entity.VisitorEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface VisitorRepository extends JpaRepository<VisitorEntity, Long> {
    
    List<VisitorEntity> findByDataVisita(LocalDate date);
    
    List<VisitorEntity> findByDataVisitaBetween(LocalDate start, LocalDate end);
    
    List<VisitorEntity> findByNomeCompletoContainingIgnoreCase(String nome);
    
    Long countByDataVisita(LocalDate date);
    
    @Query("SELECT v FROM VisitorEntity v WHERE v.dataVisita IN :dates ORDER BY v.dataVisita ASC")
    List<VisitorEntity> findByDataVisitaIn(@Param("dates") List<LocalDate> dates);
    
    @Query("SELECT v.dataVisita, COUNT(v) FROM VisitorEntity v WHERE v.dataVisita IN :dates GROUP BY v.dataVisita ORDER BY v.dataVisita ASC")
    List<Object[]> countByDataVisitaIn(@Param("dates") List<LocalDate> dates);
}

