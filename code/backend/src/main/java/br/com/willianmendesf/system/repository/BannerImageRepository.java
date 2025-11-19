package br.com.willianmendesf.system.repository;

import br.com.willianmendesf.system.model.entity.BannerImage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface BannerImageRepository extends JpaRepository<BannerImage, Long> {

    List<BannerImage> findByActiveTrueOrderByDisplayOrderAsc();
}

