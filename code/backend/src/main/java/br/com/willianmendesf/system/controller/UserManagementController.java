package br.com.willianmendesf.system.controller;

import br.com.willianmendesf.system.model.dto.UserDTO;
import br.com.willianmendesf.system.model.entity.User;
import br.com.willianmendesf.system.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/users")
@RequiredArgsConstructor
public class UserManagementController {

    private final UserService userService;

    /**
     * GET /api/v1/users
     * Lists all users
     * Requires READ_USERS permission
     */
    @GetMapping
    @PreAuthorize("hasAuthority('READ_USERS')")
    public ResponseEntity<List<UserDTO>> getAll() {
        List<UserDTO> users = userService.findAll();
        return ResponseEntity.ok(users);
    }

    /**
     * GET /api/v1/users/{id}
     * Gets a specific user
     */
    @GetMapping("/{id}")
    @PreAuthorize("hasAuthority('READ_USERS')")
    public ResponseEntity<UserDTO> getById(@PathVariable Long id) {
        UserDTO user = userService.findById(id);
        return ResponseEntity.ok(user);
    }

    /**
     * POST /api/v1/users
     * Creates a new user
     * Requires WRITE_USERS permission
     */
    @PostMapping
    @PreAuthorize("hasAuthority('WRITE_USERS')")
    public ResponseEntity<UserDTO> create(@RequestBody UserDTO userDTO, Authentication authentication) {
        User loggedUser = (User) authentication.getPrincipal();
        UserDTO created = userService.createUser(userDTO, loggedUser);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    /**
     * PUT /api/v1/users/{id}
     * Updates a user
     * Requires WRITE_USERS permission
     */
    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority('WRITE_USERS')")
    public ResponseEntity<UserDTO> update(
            @PathVariable Long id,
            @RequestBody UserDTO userDTO,
            Authentication authentication) {
        User loggedUser = (User) authentication.getPrincipal();
        UserDTO updated = userService.updateUser(id, userDTO, loggedUser);
        return ResponseEntity.ok(updated);
    }

    /**
     * DELETE /api/v1/users/{id}
     * Deletes a user
     * Requires DELETE_USERS permission
     */
    @DeleteMapping("/{id}")
    @PreAuthorize("hasAuthority('DELETE_USERS')")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        userService.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}

