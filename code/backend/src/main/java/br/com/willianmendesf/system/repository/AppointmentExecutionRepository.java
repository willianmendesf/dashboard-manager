package br.com.willianmendesf.system.repository;

import br.com.willianmendesf.system.model.entity.AppointmentExecution;
import br.com.willianmendesf.system.model.enums.TaskStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;
import java.util.List;

public interface AppointmentExecutionRepository extends JpaRepository<AppointmentExecution, Long> {
    boolean existsByAppointmentIdAndScheduledTime(Long appointmentId, LocalDateTime scheduledTime);
    
    List<AppointmentExecution> findAllByOrderByExecutionTimeDesc();
    
    List<AppointmentExecution> findByStatusOrderByExecutionTimeDesc(TaskStatus status);
    
    List<AppointmentExecution> findByAppointmentIdOrderByExecutionTimeDesc(Long appointmentId);
}