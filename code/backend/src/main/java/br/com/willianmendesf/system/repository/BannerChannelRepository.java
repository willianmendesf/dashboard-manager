package br.com.willianmendesf.system.repository;

import br.com.willianmendesf.system.model.entity.BannerChannel;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface BannerChannelRepository extends JpaRepository<BannerChannel, Long> {

    List<BannerChannel> findByIsActiveTrueOrderByDisplayOrderAsc();

    Optional<BannerChannel> findByName(String name);
}

