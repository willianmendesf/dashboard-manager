package br.com.willianmendesf.system.repository;

import br.com.willianmendesf.system.model.entity.BannerConfig;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
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

    @Query("SELECT b FROM BannerConfig b WHERE b.isActive = true " +
           "AND b.startTime <= :currentTime AND b.endTime >= :currentTime " +
           "AND (b.isRecurring = true OR (b.isRecurring = false AND b.specificDate = :currentDate)) " +
           "AND (:channelId IS NULL OR SIZE(b.channels) = 0 OR EXISTS (SELECT 1 FROM b.channels c WHERE c.id = :channelId)) " +
           "ORDER BY b.order ASC")
    Optional<BannerConfig> findActiveByTimeAndChannelAndDate(
            @Param("currentTime") LocalTime currentTime,
            @Param("currentDate") LocalDate currentDate,
            @Param("channelId") Long channelId
    );

    @Modifying(flushAutomatically = true, clearAutomatically = true)
    @Query(value = "DELETE FROM banner_config_channels WHERE config_id = :configId", nativeQuery = true)
    void deleteConfigChannelAssociations(@Param("configId") Long configId);
}

