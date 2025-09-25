package br.com.willianmendesf.system.controller;

import br.com.willianmendesf.system.model.dto.RegisterDTO;
import br.com.willianmendesf.system.model.entity.RegisterEntity;
import br.com.willianmendesf.system.service.RegisterService;
import lombok.AllArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/members")
@AllArgsConstructor
public class MembersController {

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
    public ResponseEntity<Object> create(@RequestBody RegisterEntity member) {
        service.create(member);
        return ResponseEntity.status(HttpStatus.CREATED).build();
    }

    @PatchMapping("/{id}")
    public ResponseEntity<HttpStatus> updateUserById(@PathVariable Long id, @RequestBody RegisterEntity member) {
        RegisterEntity createdUserEntity = service.updateById(id, member);
        return ResponseEntity.status(201).body(HttpStatus.CREATED);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Object> delete(@PathVariable Long id) {
        service.delete(id);
        return ResponseEntity.ok().build();
    }
}
