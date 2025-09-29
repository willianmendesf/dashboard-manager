package br.com.willianmendesf.system.service;

import br.com.willianmendesf.system.model.dto.AppointmentsDTO;
import br.com.willianmendesf.system.model.entity.AppointmentsEntity;
import br.com.willianmendesf.system.repository.AppointmentsRepository;
import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@AllArgsConstructor
public class AppointmentsService {

    private final AppointmentsRepository repository;

    public List<AppointmentsEntity> getAll() {
        log.info("Fetching all appointments from the database");
        List<AppointmentsEntity> entity = repository.findAll();
        return entity.stream().map(AppointmentsEntity::new).collect(Collectors.toList());
    }

    public AppointmentsDTO getByName(String name) {
        log.info("Fetching appointment with name: {}", name);
        AppointmentsEntity entity = repository.findAll().stream().filter(a -> a.getName().equals(name)).findFirst().orElse(null);
        return new AppointmentsDTO(entity);
    }

    public AppointmentsDTO getById(Long id) {
        log.info("Fetching appointment with ID: {}", id);
        AppointmentsEntity entity = repository.findById(id).orElse(null);
        return new AppointmentsDTO(entity);
    }

    public void create(AppointmentsEntity appointment) {
        log.info("Creating new appointment!");
        repository.save(appointment);
    }

    public void update(Long id, AppointmentsEntity updatedAppointment) {
        log.info("Updating appointment with ID: {}", id);
        repository.save(updatedAppointment);
    }

    public void delete(Long id) {
        log.info("Deleting appointment with ID: {}", id);
        repository.deleteById(id);
    }
}
