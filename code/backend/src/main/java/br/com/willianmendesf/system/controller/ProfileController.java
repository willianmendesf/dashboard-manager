package br.com.willianmendesf.system.controller;

import br.com.willianmendesf.system.model.dto.ProfileDTO;
import br.com.willianmendesf.system.model.entity.Permission;
import br.com.willianmendesf.system.model.entity.Profile;
import br.com.willianmendesf.system.model.entity.User;
import br.com.willianmendesf.system.repository.PermissionRepository;
import br.com.willianmendesf.system.repository.ProfileRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/profiles")
@RequiredArgsConstructor
public class ProfileController {

    private final ProfileRepository profileRepository;
    private final PermissionRepository permissionRepository;

    /**
     * GET /api/v1/profiles
     * Lists all profiles
     * Requires READ_PROFILES permission
     */
    @GetMapping
    @PreAuthorize("hasAuthority('READ_PROFILES')")
    public ResponseEntity<List<ProfileDTO>> getAll() {
        List<Profile> profiles = profileRepository.findAll();
        List<ProfileDTO> dtos = profiles.stream()
            .map(this::toDTO)
            .collect(Collectors.toList());
        return ResponseEntity.ok(dtos);
    }

    /**
     * GET /api/v1/profiles/{id}
     * Gets a specific profile
     */
    @GetMapping("/{id}")
    @PreAuthorize("hasAuthority('READ_PROFILES')")
    public ResponseEntity<ProfileDTO> getById(@PathVariable Long id) {
        Profile profile = profileRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Profile not found: " + id));
        return ResponseEntity.ok(toDTO(profile));
    }

    /**
     * POST /api/v1/profiles
     * Creates a new profile
     * Requires WRITE_PROFILES permission
     */
    @PostMapping
    @PreAuthorize("hasAuthority('WRITE_PROFILES')")
    public ResponseEntity<ProfileDTO> create(@RequestBody ProfileDTO dto, Authentication authentication) {
        // Check if profile name already exists
        if (profileRepository.existsByName(dto.getName())) {
            return ResponseEntity.badRequest().build();
        }

        Profile profile = new Profile();
        profile.setName(dto.getName());
        profile.setDescription(dto.getDescription());

        // Set permissions
        if (dto.getPermissionIds() != null && !dto.getPermissionIds().isEmpty()) {
            List<Permission> permissions = permissionRepository.findAllById(dto.getPermissionIds());
            profile.setPermissions(permissions.stream().collect(Collectors.toSet()));
        }

        Profile saved = profileRepository.save(profile);
        return ResponseEntity.status(HttpStatus.CREATED).body(toDTO(saved));
    }

    /**
     * PUT /api/v1/profiles/{id}
     * Updates a profile
     * Requires WRITE_PROFILES permission
     * Business rule: Only ROOT can modify ROOT profile
     */
    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority('WRITE_PROFILES')")
    public ResponseEntity<ProfileDTO> update(
            @PathVariable Long id,
            @RequestBody ProfileDTO dto,
            Authentication authentication) {
        
        Profile profile = profileRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Profile not found: " + id));

        User currentUser = (User) authentication.getPrincipal();

        // Business rule: Only ROOT can modify ROOT profile
        if (profile.getName().equals("ROOT") && !currentUser.getProfile().getName().equals("ROOT")) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }

        profile.setName(dto.getName());
        profile.setDescription(dto.getDescription());

        // Update permissions
        if (dto.getPermissionIds() != null) {
            List<Permission> permissions = permissionRepository.findAllById(dto.getPermissionIds());
            profile.setPermissions(permissions.stream().collect(Collectors.toSet()));
        }

        Profile saved = profileRepository.save(profile);
        return ResponseEntity.ok(toDTO(saved));
    }

    /**
     * DELETE /api/v1/profiles/{id}
     * Deletes a profile
     * Requires DELETE_PROFILES permission
     * Business rule: Cannot delete ROOT profile
     */
    @DeleteMapping("/{id}")
    @PreAuthorize("hasAuthority('DELETE_PROFILES')")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        Profile profile = profileRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Profile not found: " + id));

        // Business rule: Cannot delete ROOT profile
        if (profile.getName().equals("ROOT")) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }

        profileRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }

    private ProfileDTO toDTO(Profile profile) {
        ProfileDTO dto = new ProfileDTO();
        dto.setId(profile.getId());
        dto.setName(profile.getName());
        dto.setDescription(profile.getDescription());
        dto.setPermissionIds(profile.getPermissions().stream()
            .map(Permission::getId)
            .collect(Collectors.toList()));
        dto.setPermissionNames(profile.getPermissions().stream()
            .map(Permission::getName)
            .collect(Collectors.toList()));
        return dto;
    }
}

