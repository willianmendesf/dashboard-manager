package br.com.willianmendesf.system.controller;

import br.com.willianmendesf.system.model.dto.PermissionDTO;
import br.com.willianmendesf.system.model.entity.Permission;
import br.com.willianmendesf.system.repository.PermissionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/permissions")
@RequiredArgsConstructor
public class PermissionController {

    private final PermissionRepository permissionRepository;

    /**
     * GET /api/v1/permissions
     * Lists all permissions
     * Requires READ_PROFILES permission (to manage profiles)
     */
    @GetMapping
    @PreAuthorize("hasAuthority('READ_PROFILES')")
    public ResponseEntity<List<PermissionDTO>> getAll() {
        List<Permission> permissions = permissionRepository.findAll();
        List<PermissionDTO> dtos = permissions.stream()
            .map(this::toDTO)
            .collect(Collectors.toList());
        return ResponseEntity.ok(dtos);
    }

    private PermissionDTO toDTO(Permission permission) {
        PermissionDTO dto = new PermissionDTO();
        dto.setId(permission.getId());
        dto.setName(permission.getName());
        dto.setDescription(permission.getDescription());
        return dto;
    }
}

