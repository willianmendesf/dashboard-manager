package br.com.willianmendesf.system.model.entity;

import br.com.willianmendesf.system.model.enums.TaskStatus;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import lombok.Data;

import java.time.LocalDateTime;

@Entity
@Data
public class AppointmentExecution {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long appointmentId;

    @Column(nullable = false)
    private LocalDateTime scheduledTime;

    @Column(nullable = false)
    private LocalDateTime executionTime;

    @Column(nullable = false)
    private TaskStatus status;
}
