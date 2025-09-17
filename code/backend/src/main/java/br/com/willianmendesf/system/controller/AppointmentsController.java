package br.com.willianmendesf.system.controller;

import br.com.willianmendesf.system.model.Appointments;
import br.com.willianmendesf.system.service.AppointmentsService;
import lombok.AllArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@AllArgsConstructor
@RequestMapping("/appointments")
public class AppointmentsController {

    private final AppointmentsService service;

    @GetMapping
    public ResponseEntity<Iterable<Appointments>> getAllAppointments() {
        Iterable<Appointments> appointments = service.getAllAppointments();
        return ResponseEntity.ok(appointments);
    }

    @GetMapping("/id/{id}")
    public ResponseEntity<Appointments> getAppointmentById(@PathVariable Long id) {
        Appointments appointment = service.getAppointmentById(id);
        return ResponseEntity.ok(appointment);
    }

    @GetMapping("/{name}")
    public ResponseEntity<Appointments> getAppointmentByName(@PathVariable String name) {
        Appointments appointment = service.getAppointmentByName(name);
        return ResponseEntity.ok(appointment);
    }

    @PostMapping
    public ResponseEntity<Void> createAppointment(@RequestBody Appointments appointment) {
        service.createAppointment(appointment);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/{id}")
    public ResponseEntity<Void> updateAppointment(@PathVariable Long id, @RequestBody Appointments updatedAppointment) {
        service.updateAppointment(id, updatedAppointment);
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteAppointment(@PathVariable Long id) {
        service.deleteAppointment(id);
        return ResponseEntity.ok().build();
    }
}
