package br.com.willianmendesf.system.cache;

import br.com.willianmendesf.system.model.entity.AppointmentEntity;
import org.springframework.stereotype.Component;

import java.util.Collection;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Component
public class AppointmentCache {
    private Map<Long, AppointmentEntity> cache = new ConcurrentHashMap<>();

    public void loadAppointments(List<AppointmentEntity> appointments) {
        cache.clear();
        appointments.forEach(appointment -> cache.put(appointment.getId(), appointment));
    }

    public Collection<AppointmentEntity> getAllAppointments() {
        return cache.values();
    }

    public AppointmentEntity getAppointment(Long id) {
        return cache.get(id);
    }

    public void updateAppointment(AppointmentEntity appointment) {
        cache.put(appointment.getId(), appointment);
    }
}
