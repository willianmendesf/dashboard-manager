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

//    @GetMapping("/recent")
//    public ResponseEntity<UserDTO> getLastCreated() {
//        UserDTO response = userService.getLastCreated();
//        return ResponseEntity.ok(response);
//    }

    @PatchMapping("/{id}")
    public ResponseEntity<HttpStatus> updateUserById(@PathVariable Long id, @RequestBody UserEntity userEntity) {
        UserEntity createdUserEntity = userService.updateById(id, userEntity);
        return ResponseEntity.status(201).body(HttpStatus.CREATED);
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

