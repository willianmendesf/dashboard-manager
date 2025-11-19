package br.com.willianmendesf.system.repository;

import br.com.willianmendesf.system.model.entity.BannerConfig;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface BannerConfigRepository extends JpaRepository<BannerConfig, Long> {

    List<BannerConfig> findByIsActiveTrueOrderByOrderAsc();

    @Query("SELECT b FROM BannerConfig b WHERE b.isActive = true " +
           "AND b.startTime <= :currentTime AND b.endTime >= :currentTime " +
           "ORDER BY b.order ASC")
    Optional<BannerConfig> findActiveByTime(@Param("currentTime") LocalTime currentTime);
}

