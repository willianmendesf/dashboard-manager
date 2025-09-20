package br.com.willianmendesf.system.model.dto;

import br.com.willianmendesf.system.model.entity.AppointmentsEntity;
import lombok.Data;

@Data
public class AppointmentsDTO {
    private String name;
    private String schedule;
    private Boolean enabled;
    private Boolean development;
    private Boolean monitoring;

    public AppointmentsDTO () {}

    public AppointmentsDTO(AppointmentsEntity entity) {
        this.name = entity.getName();
        this.schedule = entity.getSchedule();
        this.enabled = entity.getEnabled();
        this.development = entity.getDevelopment();
        this.monitoring = entity.getMonitoring();
    }

    @Override
    public String toString() {
        return "AppointmentsDTO{" +
                "name='" + name + '\'' +
                ", schedule='" + schedule + '\'' +
                ", enabled=" + enabled +
                ", development=" + development +
                ", monitoring=" + monitoring +
                '}';
    }
}
