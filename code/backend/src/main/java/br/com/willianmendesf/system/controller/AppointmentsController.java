package br.com.willianmendesf.system.controller;

import br.com.willianmendesf.system.model.dto.AppointmentDTO;
import br.com.willianmendesf.system.model.entity.AppointmentEntity;
import br.com.willianmendesf.system.service.AppointmentService;
import lombok.AllArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@AllArgsConstructor
@RequestMapping("/appointments")
public class AppointmentsController {

    private final AppointmentService service;

    @GetMapping
    public ResponseEntity<List<AppointmentEntity>> getAll() {
        return ResponseEntity.ok(service.getAll());
    }

    @GetMapping("/id/{id}")
    public ResponseEntity<AppointmentDTO> getById(@PathVariable Long id) {
        AppointmentDTO appointment = service.getById(id);
        return ResponseEntity.ok(appointment);
    }

    @GetMapping("/{name}")
    public ResponseEntity<AppointmentDTO> getByName(@PathVariable String name) {
        AppointmentDTO appointment = service.getByName(name);
        return ResponseEntity.ok(appointment);
    }

    @PostMapping
    public ResponseEntity<Void> create(@RequestBody AppointmentEntity appointment) {
        service.create(appointment);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/{id}")
    public ResponseEntity<Void> update(@PathVariable Long id, @RequestBody AppointmentEntity updatedAppointment) {
        service.update(id, updatedAppointment);
            return ResponseEntity.ok().build();
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        service.delete(id);
        return ResponseEntity.ok().build();
    }
}
