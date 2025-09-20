package br.com.willianmendesf.system.controller;

import br.com.willianmendesf.system.model.entity.RegisterEntity;
import br.com.willianmendesf.system.model.dto.RegisterDTO;
import br.com.willianmendesf.system.service.RegisterService;
import lombok.AllArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/register")
@AllArgsConstructor
public class RegisterController {

    private final RegisterService service;

    @GetMapping
    public ResponseEntity<List<RegisterDTO>> getAll() {
        return ResponseEntity.ok(service.getAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<RegisterDTO> getById(@PathVariable Long id) {
        RegisterDTO response = service.getById(id);
        return ResponseEntity.ok(response);
    }

    @PostMapping
    public ResponseEntity<Object> create(@RequestBody RegisterEntity cadastro) {
        service.create(cadastro);
        return ResponseEntity.status(HttpStatus.CREATED).build();
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Object> delete(@PathVariable Long id) {
        service.delete(id);
        return ResponseEntity.ok().build();
    }
}
