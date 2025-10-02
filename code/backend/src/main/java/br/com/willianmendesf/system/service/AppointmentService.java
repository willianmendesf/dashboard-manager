package br.com.willianmendesf.system.service;

import br.com.willianmendesf.system.exception.AppointmentException;
import br.com.willianmendesf.system.model.dto.AppointmentDTO;
import br.com.willianmendesf.system.model.entity.AppointmentEntity;
import br.com.willianmendesf.system.repository.AppointmentRepository;
import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@AllArgsConstructor
public class AppointmentService {

    private final AppointmentRepository repository;

    public List<AppointmentEntity> getAll() {
        log.info("Fetching all appointments from the database");
        List<AppointmentEntity> entity = repository.findAll();
        return entity.stream().map(AppointmentEntity::new).collect(Collectors.toList());
    }

    public AppointmentDTO getByName(String name) {
        log.info("Fetching appointment with name: {}", name);
        AppointmentEntity entity = repository.findAll().stream().filter(a -> a.getName().equals(name)).findFirst().orElse(null);
        return new AppointmentDTO(entity);
    }

    public AppointmentDTO getById(Long id) {
        log.info("Fetching appointment with ID: {}", id);
        AppointmentEntity entity = repository.findById(id).orElse(null);
        return new AppointmentDTO(entity);
    }

    public void create(AppointmentEntity appointment) {
        log.info("Creating new appointment!");
        AppointmentEntity entity = new AppointmentEntity(repository.findMaxId() + 1, appointment);
        repository.save(entity);
    }

    public void update(Long id, AppointmentEntity updatedAppointment) {
        log.info("Updating appointment with ID: {}", id);
        AppointmentEntity updateAppointment = repository.findById(id)
                .orElseThrow(() -> new AppointmentException("Appointment not found for id: " + id));

        updateAppointment.setAppointmentEntity(updatedAppointment);

        repository.save(updateAppointment);
    }

    public void delete(Long id) {
        log.info("Deleting appointment with ID: {}", id);
        repository.deleteById(id);
    }
}
