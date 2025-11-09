package br.com.willianmendesf.system.controller;

import br.com.willianmendesf.system.model.dto.UserDTO;
import br.com.willianmendesf.system.model.entity.User;
import br.com.willianmendesf.system.repository.UserRepository;
import br.com.willianmendesf.system.service.UserService;
import br.com.willianmendesf.system.service.storage.StorageService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/users")
@RequiredArgsConstructor
@Slf4j
public class UserManagementController {

    private final UserService userService;
    private final UserRepository userRepository;
    private final StorageService storageService;

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
    public ResponseEntity<?> create(@RequestBody UserDTO userDTO, Authentication authentication) {
        try {
            User loggedUser = (User) authentication.getPrincipal();
            UserDTO created = userService.createUser(userDTO, loggedUser);
            return ResponseEntity.status(HttpStatus.CREATED).body(created);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(java.util.Map.of("error", e.getMessage()));
        } catch (org.springframework.security.access.AccessDeniedException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(java.util.Map.of("error", e.getMessage()));
        }
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

    /**
     * POST /api/v1/users/{id}/upload-foto
     * Uploads profile photo for a specific user
     * Requires WRITE_USERS permission
     */
    @PostMapping("/{id}/upload-foto")
    @PreAuthorize("hasAuthority('WRITE_USERS')")
    public ResponseEntity<?> uploadUserPhoto(
            @PathVariable Long id,
            @RequestParam("file") MultipartFile file) {
        
        if (file == null || file.isEmpty()) {
            return ResponseEntity.badRequest().body(java.util.Map.of("error", "File is required"));
        }

        if (!storageService.isValidImageFile(file)) {
            return ResponseEntity.badRequest().body(java.util.Map.of("error", "Invalid image file. Only JPEG, PNG and GIF are allowed."));
        }

        try {
            User user = userRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("User not found: " + id));

            // Upload file to storage with overwrite strategy
            // Uses standardized naming: usuario_id_{userId}.{ext}
            String fotoUrl = storageService.uploadFile(
                file, 
                "profiles", 
                "usuario", 
                user.getId().toString()
            );
            
            // Delete old photo if exists (overwrite strategy)
            if (user.getFotoUrl() != null && !user.getFotoUrl().equals(fotoUrl)) {
                storageService.deleteFile(user.getFotoUrl());
            }
            
            // Update user's fotoUrl
            user.setFotoUrl(fotoUrl);
            User updatedUser = userRepository.save(user);
            
            log.info("Profile photo uploaded for user ID: {} (overwrite strategy)", id);
            
            return ResponseEntity.ok(java.util.Map.of("fotoUrl", fotoUrl, "user", userService.toDTO(updatedUser)));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(java.util.Map.of("error", e.getMessage()));
        } catch (Exception e) {
            log.error("Error uploading profile photo for user ID: {}", id, e);
            return ResponseEntity.internalServerError().body(java.util.Map.of("error", "Error uploading photo"));
        }
    }
}

