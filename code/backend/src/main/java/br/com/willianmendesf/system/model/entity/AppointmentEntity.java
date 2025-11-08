package br.com.willianmendesf.system.model.entity;

import br.com.willianmendesf.system.exception.AppointmentException;
import br.com.willianmendesf.system.model.enums.RecipientType;
import br.com.willianmendesf.system.model.enums.TaskStatus;
import br.com.willianmendesf.system.model.enums.TaskType;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;

import java.sql.Timestamp;
import java.util.List;

import static java.util.Objects.isNull;

@Entity
@Data
@AllArgsConstructor
@Table(name = "appointments")
public class AppointmentEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private String name;
    private String description;
    private String schedule;
    private Boolean enabled;
    private Boolean development;
    private Boolean monitoring;
    private List<String> monitoringNumbers;
    private Boolean monitoringGroups;
    private List<String> monitoringGroupsIds;
    private String endpoint;
    private Long retries;
    private Long timeout;
    private String startDate;
    private String endDate;
    
    @Column(columnDefinition = "TEXT")
    private String message;
    private List<String> sendTo;
    private List<String> sendToGroups;
    private Boolean sendImage;
    private String imageToSend;

    @Column(name = "recipient_type")
    private RecipientType recipientType;

    @Enumerated(EnumType.STRING)
    @Column(name = "task_type")
    private TaskType taskType; // WHATSAPP_MESSAGE, API_CALL

    @Column(name = "last_execution")
    private Timestamp lastExecution;

    @Enumerated(EnumType.STRING)
    @Column(name = "last_status")
    private TaskStatus lastStatus; // SUCCESS, FAILURE, PENDING

    @Version
    @Column(name = "version")
    private Long version = 0L;

    public void setAppointmentEntity(AppointmentEntity entity) {
        if (isNull(entity)) throw new AppointmentException("AppointmentEntity input be not null.");

        this.id = entity.getId() != null ? entity.getId() : this.id;
        this.name = entity.getName() != null ? entity.getName() : this.name;
        this.description = entity.getDescription() != null ? entity.getDescription() : this.description;
        this.schedule = entity.getSchedule() != null ? entity.getSchedule() : this.schedule;
        this.development = entity.getDevelopment() != null ? entity.getDevelopment() : this.development;
        this.monitoring = entity.getMonitoring() != null ? entity.getMonitoring() : this.monitoring;
        this.monitoringNumbers = entity.getMonitoringNumbers() != null ? entity.getMonitoringNumbers() : this.monitoringNumbers;
        this.monitoringGroups = entity.getMonitoringGroups() != null ? entity.getMonitoringGroups() : this.monitoringGroups;
        this.monitoringGroupsIds = entity.getMonitoringGroupsIds() != null ? entity.getMonitoringGroupsIds() : this.monitoringGroupsIds;
        this.endpoint = entity.getEndpoint() != null ? entity.getEndpoint() : this.endpoint;
        this.startDate = entity.getStartDate() != null ? entity.getStartDate() : this.startDate;
        this.endDate = entity.getEndDate() != null ? entity.getEndDate() : this.endDate;
        this.message = entity.getMessage() != null ? entity.getMessage() : this.message;
        this.taskType = entity.getTaskType() != null ? entity.getTaskType() : this.taskType;
        this.lastExecution = entity.getLastExecution() != null ? entity.getLastExecution() : this.lastExecution;
        this.lastStatus = entity.getLastStatus() != null ? entity.getLastStatus() : this.lastStatus;
        this.sendTo = entity.getSendTo() != null ? entity.getSendTo() : this.sendTo;
        this.sendToGroups = entity.getSendToGroups() != null ? entity.getSendToGroups() : this.sendToGroups;
        this.recipientType = entity.getRecipientType() != null ? entity.getRecipientType() : this.recipientType;
        this.imageToSend = entity.getImageToSend() != null ? entity.getImageToSend() : this.imageToSend;
        this.version = entity.getVersion() != null ? entity.getVersion() : this.version;

        if (entity.getRetries() != null) this.retries = entity.getRetries();
        if (entity.getEnabled() != null) this.enabled = entity.getEnabled();
        if (entity.getTimeout() != null) this.timeout = entity.getTimeout();
        if (entity.getSendImage() != null) this.sendImage = entity.getSendImage();
    }

    public AppointmentEntity() { }

    public AppointmentEntity(Long id, AppointmentEntity entity) {
        this.id = id;
        this.retries = entity.getRetries();
        this.name = entity.getName();
        this.description = entity.getDescription();
        this.schedule = entity.getSchedule();
        this.enabled = entity.getEnabled();
        this.development = entity.getDevelopment();
        this.monitoring = entity.getMonitoring();
        this.monitoringNumbers = entity.getMonitoringNumbers();
        this.monitoringGroups = entity.getMonitoringGroups();
        this.monitoringGroupsIds = entity.getMonitoringGroupsIds();
        this.endpoint = entity.getEndpoint();
        this.timeout = entity.getTimeout();
        this.startDate = entity.getStartDate();
        this.endDate = entity.getEndDate();
        this.message = entity.getMessage();
        this.taskType = entity.getTaskType();
        this.lastExecution = entity.getLastExecution();
        this.lastStatus = entity.getLastStatus();
        this.sendTo = entity.getSendTo();
        this.sendToGroups = entity.getSendToGroups();
        this.recipientType = entity.getRecipientType();
        this.sendImage = entity.getSendImage();
        this.imageToSend = entity.getImageToSend();
        this.version = entity.getVersion();
    }

    public AppointmentEntity(AppointmentEntity entity) {
        this.id = entity.getId();
        this.retries = entity.getRetries();
        this.name = entity.getName();
        this.description = entity.getDescription();
        this.schedule = entity.getSchedule();
        this.enabled = entity.getEnabled();
        this.development = entity.getDevelopment();
        this.monitoring = entity.getMonitoring();
        this.monitoringNumbers = entity.getMonitoringNumbers();
        this.monitoringGroups = entity.getMonitoringGroups();
        this.monitoringGroupsIds = entity.getMonitoringGroupsIds();
        this.endpoint = entity.getEndpoint();
        this.timeout = entity.getTimeout();
        this.startDate = entity.getStartDate();
        this.endDate = entity.getEndDate();
        this.message = entity.getMessage();
        this.taskType = entity.getTaskType();
        this.lastExecution = entity.getLastExecution();
        this.lastStatus = entity.getLastStatus();
        this.sendTo = entity.getSendTo();
        this.sendToGroups = entity.getSendToGroups();
        this.recipientType = entity.getRecipientType();
        this.sendImage = entity.getSendImage();
        this.imageToSend = entity.getImageToSend();
    }

    public AppointmentEntity(
            Long retries,
            String name,
            String description,
            String schedule,
            Boolean enabled,
            Boolean development,
            Boolean monitoring,
            List<String> monitoringNumbers,
            Boolean monitoringGroups,
            List<String> monitoringGroupsIds,
            String endpoint,
            Long timeout,
            String startDate,
            String endDate,
            String message,
            TaskType taskType,
            Timestamp lastExecution,
            TaskStatus lastStatus,
            List<String> sendTo,
            List<String> sendToGroups,
            RecipientType recipientType,
            Boolean sendImage,
            String imageToSend
    ) {
        this.retries = retries;
        this.name = name;
        this.description = description;
        this.schedule = schedule;
        this.enabled = enabled;
        this.development = development;
        this.monitoring = monitoring;
        this.monitoringNumbers = monitoringNumbers;
        this.monitoringGroups = monitoringGroups;
        this.monitoringGroupsIds = monitoringGroupsIds;
        this.endpoint = endpoint;
        this.timeout = timeout;
        this.startDate = startDate;
        this.endDate = endDate;
        this.message = message;
        this.taskType = taskType;
        this.lastExecution = lastExecution;
        this.lastStatus = lastStatus;
        this.sendTo = sendTo;
        this.sendToGroups = sendToGroups;
        this.recipientType = recipientType;
        this.sendImage = sendImage;
        this.imageToSend = imageToSend;
    }

    @Override
    public String toString() {
        return "Appointments{" +
                "id= '" + id + '\'' +
                ", name='" + name + '\'' +
                ", description=" + description +
                ", schedule='" + schedule + '\'' +
                ", enabled=" + enabled +
                ", development=" + development +
                ", monitoring=" + monitoring +
                ", monitoringNumbers=" + monitoringNumbers +
                ", monitoringGroups=" + monitoringGroups +
                ", monitoringGroupsIds=" + monitoringGroupsIds +
                ", endpoint='" + endpoint + '\'' +
                ", retries=" + retries +
                ", timeout=" + timeout +
                ", startDate=" + startDate +
                ", endDate=" + endDate +
                ", message=" + message +
                ", taskType=" + taskType +
                ", lastExecution=" + lastExecution +
                ", lastStatus=" + lastStatus +
                ", sendTo=" + sendTo +
                ", sendToGroups=" + sendToGroups +
                ", recipientType=" + recipientType +
                ", sendImage=" + sendImage +
                ", imageToSend='" + imageToSend + '\'' +
                '}';
    }
}
