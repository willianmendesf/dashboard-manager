package br.com.willianmendesf.system.cache;

import br.com.willianmendesf.system.model.entity.AppointmentsEntity;
import org.springframework.stereotype.Component;

import java.util.Collection;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Component
public class AppointmentCache {
    private Map<Long, AppointmentsEntity> cache = new ConcurrentHashMap<>();

    public void loadAppointments(List<AppointmentsEntity> appointments) {
        cache.clear();
        appointments.forEach(appointment -> cache.put(appointment.getId(), appointment));
    }

    public Collection<AppointmentsEntity> getAllAppointments() {
        return cache.values();
    }

    public AppointmentsEntity getAppointment(Long id) {
        return cache.get(id);
    }

    public void updateAppointment(AppointmentsEntity appointment) {
        cache.put(appointment.getId(), appointment);
    }
}
