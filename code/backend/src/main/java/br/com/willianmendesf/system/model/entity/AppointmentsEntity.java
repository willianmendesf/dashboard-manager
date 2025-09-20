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

    public AppointmentsEntity() { }

    public AppointmentsEntity(Long retries, String name, String schedule, Boolean enabled, Boolean development, Boolean monitoring, List<String> monitoringNumbers, Boolean monitoringGroups, List<String> monitoringGroupsIds, String endpoint, Long timeout) {
        this.retries = retries;
        this.name = name;
        this.schedule = schedule;
        this.enabled = enabled;
        this.development = development;
        this.monitoring = monitoring;
        this.monitoringNumbers = monitoringNumbers;
        this.monitoringGroups = monitoringGroups;
        this.monitoringGroupsIds = monitoringGroupsIds;
        this.endpoint = endpoint;
        this.timeout = timeout;
    }

    @Override
    public String toString() {
        return "Appointments{" +
                "name='" + name + '\'' +
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
                '}';
    }
}
