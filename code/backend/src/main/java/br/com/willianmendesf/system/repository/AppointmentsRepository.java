package br.com.willianmendesf.system.repository;

import br.com.willianmendesf.system.model.entity.AppointmentsEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

@Repository
public interface AppointmentsRepository extends JpaRepository<AppointmentsEntity, Long> {
    @Query("SELECT COALESCE(MAX(u.id), 0) FROM AppointmentsEntity u")
    Long findMaxId();
}
