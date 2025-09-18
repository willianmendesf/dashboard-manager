package br.com.willianmendesf.system.service;

import br.com.willianmendesf.system.model.AppointmentsEntity;
import br.com.willianmendesf.system.repository.AppointmentsRepository;
import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.List;

@Slf4j
@Service
@AllArgsConstructor
public class AppointmentsService {

    private final AppointmentsRepository repository;

    public List<AppointmentsEntity> getAllAppointments() {
        log.info("Fetching all appointments from the database");
        return repository.findAll();
    }

    public AppointmentsEntity getAppointmentByName(String name) {
        log.info("Fetching appointment with name: {}", name);
        return repository.findAll().stream().filter(a -> a.getName().equals(name)).findFirst().orElse(null);
    }

    public AppointmentsEntity getAppointmentById(Long id) {
        log.info("Fetching appointment with ID: {}", id);
        return repository.findById(id).orElse(null);
    }

    public void createAppointment(AppointmentsEntity appointment) {
        log.info("Creating new appointment!");
        repository.save(appointment);
    }

    public void updateAppointment(Long id, AppointmentsEntity updatedAppointment) {
        log.info("Updating appointment with ID: {}", id);
        repository.save(updatedAppointment);
    }

    public void deleteAppointment(Long id) {
        log.info("Deleting appointment with ID: {}", id);
        repository.deleteById(id);
    }
}
