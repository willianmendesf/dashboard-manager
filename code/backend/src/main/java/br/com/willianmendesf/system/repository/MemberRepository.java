package br.com.willianmendesf.system.repository;

import br.com.willianmendesf.system.model.entity.RegisterEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

@Repository
public interface RegisterRepository extends JpaRepository<RegisterEntity, Long> {
    @Query("SELECT COALESCE(MAX(u.id), 0) FROM RegisterEntity u")
    Long findMaxId();
}
