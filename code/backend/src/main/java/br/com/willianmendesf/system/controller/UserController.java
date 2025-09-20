package br.com.willianmendesf.system.controller;

import br.com.willianmendesf.system.model.entity.UserEntity;
import br.com.willianmendesf.system.model.dto.UserDTO;
import br.com.willianmendesf.system.service.UserService;
import lombok.AllArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@AllArgsConstructor
@RequestMapping("/users")
public class UserController {

    private final UserService userService;

    @GetMapping
    public ResponseEntity<List<UserDTO>> getAll() {
        List<UserDTO> response = userService.findAll();
        return ResponseEntity.ok(response);
    }

    @GetMapping("/{id}")
    public ResponseEntity<UserDTO> getById(@PathVariable Long id) {
        UserDTO response = userService.getUserById(id);
        return ResponseEntity.ok(response);
    }

    @PostMapping
    public ResponseEntity<HttpStatus> createUser(@RequestBody UserEntity userEntity) {
        UserEntity createdUserEntity = userService.createUser(userEntity);
        return ResponseEntity.status(201).body(HttpStatus.CREATED);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteById(@PathVariable Long id) {
        userService.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}

