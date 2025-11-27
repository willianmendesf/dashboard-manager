package br.com.willianmendesf.system.repository;

import br.com.willianmendesf.system.model.entity.BannerImage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface BannerImageRepository extends JpaRepository<BannerImage, Long> {

    List<BannerImage> findByActiveTrueOrderByDisplayOrderAsc();

    @Query("SELECT DISTINCT i FROM BannerImage i " +
           "WHERE i.active = true " +
           "AND (:channelId IS NULL OR SIZE(i.channels) = 0 OR EXISTS (SELECT 1 FROM i.channels c WHERE c.id = :channelId)) " +
           "ORDER BY i.displayOrder ASC")
    List<BannerImage> findByActiveTrueAndChannelsIdOrderByDisplayOrderAsc(@Param("channelId") Long channelId);

    @Modifying(flushAutomatically = true, clearAutomatically = true)
    @Query(value = "DELETE FROM banner_image_channels WHERE image_id = :imageId", nativeQuery = true)
    void deleteImageChannelAssociations(@Param("imageId") Long imageId);

    @Query(value = "SELECT channel_id FROM banner_image_channels WHERE image_id = :imageId", nativeQuery = true)
    List<Long> findChannelIdsByImageId(@Param("imageId") Long imageId);
}

