package br.com.willianmendesf.system.controller;

import br.com.willianmendesf.system.model.dto.ChangePasswordRequest;
import br.com.willianmendesf.system.model.dto.UpdateMyProfileRequest;
import br.com.willianmendesf.system.model.dto.UserDTO;
import br.com.willianmendesf.system.model.entity.User;
import br.com.willianmendesf.system.repository.UserRepository;
import br.com.willianmendesf.system.service.UserService;
import br.com.willianmendesf.system.service.storage.StorageService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.Map;

@RestController
@RequestMapping("/users")
@RequiredArgsConstructor
@Slf4j
public class UserProfileController {

    private final UserRepository userRepository;
    private final UserService userService;
    private final StorageService storageService;

    /**
     * GET /api/v1/users/me
     * Gets current user profile
     */
    @GetMapping("/me")
    public ResponseEntity<UserDTO> getCurrentUserProfile(Authentication authentication) {
        User loggedUser = (User) authentication.getPrincipal();
        UserDTO userDTO = userService.findById(loggedUser.getId());
        return ResponseEntity.ok(userDTO);
    }

    /**
     * PUT /api/v1/users/me
     * Updates current user profile (only name and telefone)
     */
    @PutMapping("/me")
    public ResponseEntity<UserDTO> updateMyProfile(
            @RequestBody UpdateMyProfileRequest request,
            Authentication authentication) {
        User loggedUser = (User) authentication.getPrincipal();
        
        try {
            UserDTO updated = userService.updateMyProfile(loggedUser, request.getName(), request.getTelefone());
            return ResponseEntity.ok(updated);
        } catch (Exception e) {
            log.error("Error updating profile", e);
            return ResponseEntity.badRequest().build();
        }
    }

    /**
     * POST /api/v1/users/perfil/upload-foto
     * Uploads profile photo for the logged-in user
     */
    @PostMapping("/perfil/upload-foto")
    public ResponseEntity<UserDTO> uploadProfilePhoto(
            @RequestParam("file") MultipartFile file,
            Authentication authentication) {
        
        User loggedUser = (User) authentication.getPrincipal();
        
        if (file == null || file.isEmpty()) {
            return ResponseEntity.badRequest().build();
        }

        if (!storageService.isValidImageFile(file)) {
            return ResponseEntity.badRequest().build();
        }

        try {
            // Upload file to storage with overwrite strategy
            // Uses standardized naming: usuario_id_{userId}.{ext}
            String fotoUrl = storageService.uploadFile(
                file, 
                "profiles", 
                "usuario", 
                loggedUser.getId().toString()
            );
            
            // Delete old photo if exists (overwrite strategy)
            if (loggedUser.getFotoUrl() != null && !loggedUser.getFotoUrl().equals(fotoUrl)) {
                storageService.deleteFile(loggedUser.getFotoUrl());
            }
            
            // Update user's fotoUrl
            loggedUser.setFotoUrl(fotoUrl);
            User updatedUser = userRepository.save(loggedUser);
            
            log.info("Profile photo uploaded for user: {} (overwrite strategy)", loggedUser.getUsername());
            
            return ResponseEntity.ok(userService.toDTO(updatedUser));
        } catch (Exception e) {
            log.error("Error uploading profile photo", e);
            return ResponseEntity.internalServerError().build();
        }
    }

    /**
     * DELETE /api/v1/users/perfil/remove-foto
     * Removes profile photo from logged-in user
     */
    @DeleteMapping("/perfil/remove-foto")
    public ResponseEntity<UserDTO> removeProfilePhoto(Authentication authentication) {
        User loggedUser = (User) authentication.getPrincipal();
        
        try {
            UserDTO updated = userService.removeProfilePhoto(loggedUser);
            return ResponseEntity.ok(updated);
        } catch (Exception e) {
            log.error("Error removing profile photo", e);
            return ResponseEntity.internalServerError().build();
        }
    }

    /**
     * PUT /api/v1/users/me/alterar-senha
     * Changes password for logged-in user
     */
    @PutMapping("/me/alterar-senha")
    public ResponseEntity<Map<String, String>> changePassword(
            @RequestBody ChangePasswordRequest request,
            Authentication authentication) {
        User loggedUser = (User) authentication.getPrincipal();
        
        try {
            // Validate password confirmation
            if (!request.getNovaSenha().equals(request.getConfirmarNovaSenha())) {
                return ResponseEntity.badRequest()
                    .body(Map.of("error", "As senhas não coincidem"));
            }

            userService.changePassword(loggedUser, request.getSenhaAtual(), request.getNovaSenha());
            return ResponseEntity.ok(Map.of("message", "Senha alterada com sucesso"));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest()
                .body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            log.error("Error changing password", e);
            return ResponseEntity.internalServerError()
                .body(Map.of("error", "Erro ao alterar senha"));
        }
    }
}

