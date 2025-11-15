package br.com.willianmendesf.system.model.dto;

import br.com.willianmendesf.system.model.entity.AppointmentExecution;
import br.com.willianmendesf.system.model.enums.TaskStatus;
import lombok.Data;

import java.time.LocalDateTime;

@Data
public class AppointmentExecutionLogDTO {
    private Long id;
    private Long appointmentId;
    private String appointmentName;
    private LocalDateTime scheduledTime;
    private LocalDateTime executionTime;
    private TaskStatus status;
    private String errorMessage;

    public AppointmentExecutionLogDTO() {}

    public AppointmentExecutionLogDTO(AppointmentExecution execution, String appointmentName) {
        this.id = execution.getId();
        this.appointmentId = execution.getAppointmentId();
        this.appointmentName = appointmentName;
        this.scheduledTime = execution.getScheduledTime();
        this.executionTime = execution.getExecutionTime();
        this.status = execution.getStatus();
        this.errorMessage = execution.getErrorMessage();
    }
}

