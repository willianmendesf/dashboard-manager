package br.com.willianmendesf.system.controller;

import br.com.willianmendesf.system.model.AppointmentsEntity;
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
    public ResponseEntity<Iterable<AppointmentsEntity>> getAll() {
        Iterable<AppointmentsEntity> appointments = service.getAll();
        return ResponseEntity.ok(appointments);
    }

    @GetMapping("/id/{id}")
    public ResponseEntity<AppointmentsEntity> getById(@PathVariable Long id) {
        AppointmentsEntity appointment = service.getById(id);
        return ResponseEntity.ok(appointment);
    }

    @GetMapping("/{name}")
    public ResponseEntity<AppointmentsEntity> getByName(@PathVariable String name) {
        AppointmentsEntity appointment = service.getByName(name);
        return ResponseEntity.ok(appointment);
    }

    @PostMapping
    public ResponseEntity<Void> create(@RequestBody AppointmentsEntity appointment) {
        service.create(appointment);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/{id}")
    public ResponseEntity<Void> update(@PathVariable Long id, @RequestBody AppointmentsEntity updatedAppointment) {
        service.update(id, updatedAppointment);
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        service.delete(id);
        return ResponseEntity.ok().build();
    }
}
