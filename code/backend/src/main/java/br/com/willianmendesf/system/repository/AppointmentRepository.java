package br.com.willianmendesf.system.repository;

import br.com.willianmendesf.system.model.entity.AppointmentEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface AppointmentRepository extends JpaRepository<AppointmentEntity, Long> {
    @Query("SELECT COALESCE(MAX(u.id), 0) FROM AppointmentEntity u")
    Long findMaxId();
    List<AppointmentEntity> findByEnabledTrue();
    Optional<AppointmentEntity> findByName(String name);
}
