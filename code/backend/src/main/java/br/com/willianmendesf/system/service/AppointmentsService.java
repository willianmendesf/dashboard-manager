package br.com.willianmendesf.system.service;

import br.com.willianmendesf.system.interfaces.AppointmentsInterface;
import br.com.willianmendesf.system.model.Appointments;
import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.List;

@Slf4j
@Service
@AllArgsConstructor
public class AppointmentsService {

    private final AppointmentsInterface appointments;

    public List<Appointments> getAllAppointments() {
        log.info("Fetching all appointments from the database");
        return appointments.findAll();
    }

    public Appointments getAppointmentByName(String name) {
        log.info("Fetching appointment with name: {}", name);
        return appointments.findAll().stream().filter(a -> a.getName().equals(name)).findFirst().orElse(null);
    }

    public Appointments getAppointmentById(Long id) {
        log.info("Fetching appointment with ID: {}", id);
        return appointments.findById(id).orElse(null);
    }

    public void createAppointment(Appointments appointment) {
        log.info("Creating new appointment!");
        appointments.save(appointment);
    }

    public void updateAppointment(Long id, Appointments updatedAppointment) {
        log.info("Updating appointment with ID: {}", id);
        if (appointments.existsById(id)) {
            updatedAppointment.setId(id);
            appointments.save(updatedAppointment);
        }
    }

    public void deleteAppointment(Long id) {
        log.info("Deleting appointment with ID: {}", id);
        appointments.deleteById(id);
    }
}
