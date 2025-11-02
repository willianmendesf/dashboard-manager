package br.com.willianmendesf.system.repository;

import br.com.willianmendesf.system.model.entity.AppointmentExecution;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;

public interface AppointmentExecutionRepository extends JpaRepository<AppointmentExecution, Long> {
    boolean existsByAppointmentIdAndScheduledTime(Long appointmentId, LocalDateTime scheduledTime);
}