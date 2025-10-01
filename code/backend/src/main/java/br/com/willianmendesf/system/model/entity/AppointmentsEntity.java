package br.com.willianmendesf.system.model.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;

import java.util.List;

@Entity
@Data
@AllArgsConstructor
@Table(name = "appointments")
public class AppointmentsEntity {
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
    private String message;

    public AppointmentsEntity() { }

    public AppointmentsEntity(AppointmentsEntity entity) {
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
    }

    public AppointmentsEntity(Long retries, String name, String description, String schedule, Boolean enabled, Boolean development, Boolean monitoring, List<String> monitoringNumbers, Boolean monitoringGroups, List<String> monitoringGroupsIds, String endpoint, Long timeout, String startDate, String endDate, String message) {
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
                '}';
    }
}
