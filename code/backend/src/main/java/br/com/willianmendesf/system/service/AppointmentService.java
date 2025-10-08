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
        try {
            log.info("Fetching all appointments from the database");
            List<AppointmentEntity> entity = repository.findAll();
            return entity.stream().map(AppointmentEntity::new).collect(Collectors.toList());
        } catch(Exception e) {
            throw new AppointmentException(e.getMessage());
        }
    }

    public AppointmentDTO getByName(String name) {
        try {
            log.info("Fetching appointment with name: {}", name);
            AppointmentEntity entity = repository.findAll().stream().filter(a -> a.getName().equals(name)).findFirst().orElse(null);
            assert entity != null;
            return new AppointmentDTO(entity);
        } catch(Exception e) {
            throw new AppointmentException(e.getMessage());
        }
    }

    public AppointmentDTO getById(Long id) {
        try {
            log.info("Fetching appointment with ID: {}", id);
            AppointmentEntity entity = repository.findById(id).orElse(null);
            assert entity != null;
            return new AppointmentDTO(entity);
        } catch(Exception e) {
            throw new AppointmentException(e.getMessage());
        }
    }

    public void create(AppointmentEntity appointment) {
        try {
            log.info("Creating new appointment!");
            repository.save(appointment);
        } catch(Exception e) {
            throw new AppointmentException(e.getMessage());
        }
    }

    public void update(Long id, AppointmentEntity updatedAppointment) {
        try {
            log.info("Updating appointment with ID: {}", id);
            AppointmentEntity updateAppointment = repository.findById(id)
                    .orElseThrow(() -> new AppointmentException("Appointment not found for id: " + id));
            updateAppointment.setAppointmentEntity(updatedAppointment);
            repository.save(updateAppointment);
        } catch(Exception e) {
            throw new AppointmentException(e.getMessage());
        }
    }

    public void delete(Long id) {
        try {
            log.info("Deleting appointment with ID: {}", id);
            repository.deleteById(id);
        } catch(Exception e) {
            throw new AppointmentException(e.getMessage());
        }
    }
}
