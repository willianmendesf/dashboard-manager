package br.com.willianmendesf.system.controller;

import br.com.willianmendesf.system.model.dto.ConfigurationDTO;
import br.com.willianmendesf.system.model.entity.SystemConfiguration;
import br.com.willianmendesf.system.service.ConfigService;
import lombok.AllArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@AllArgsConstructor
@RequestMapping("/configurations")
public class ConfigurationsController {

    private final ConfigService configService;

    /**
     * GET /api/v1/configurations
     * Lists all system configurations
     * Requires WRITE_CONFIG permission
     */
    @GetMapping
    @PreAuthorize("hasAuthority('READ_CONFIG')")
    public ResponseEntity<List<ConfigurationDTO>> getAll() {
        List<SystemConfiguration> configurations = configService.getAllEntities();
        List<ConfigurationDTO> dtos = configurations.stream()
            .map(this::toDTO)
            .toList();
        return ResponseEntity.ok(dtos);
    }

    /**
     * GET /api/v1/configurations/{key}
     * Gets a specific configuration by key
     */
    @GetMapping("/{key}")
    public ResponseEntity<ConfigurationDTO> getByKey(@PathVariable String key) {
        String value = configService.get(key);
        if (value == null) {
            return ResponseEntity.notFound().build();
        }
        
        // Fetch complete entity to get metadata
        List<SystemConfiguration> all = configService.getAllEntities();
        SystemConfiguration config = all.stream()
            .filter(c -> c.getKey().equals(key))
            .findFirst()
            .orElse(null);
        
        if (config == null) {
            return ResponseEntity.notFound().build();
        }
        
        return ResponseEntity.ok(toDTO(config));
    }

    /**
     * PUT /api/v1/configurations
     * Updates one or more configurations
     * Body: { "key1": "value1", "key2": "value2", ... }
     * Requires WRITE_CONFIG permission
     */
    @PutMapping
    @PreAuthorize("hasAuthority('WRITE_CONFIG')")
    public ResponseEntity<Map<String, String>> updateConfigurations(@RequestBody Map<String, String> configurations) {
        configService.setAll(configurations);
        return ResponseEntity.ok(configurations);
    }

    /**
     * PUT /api/v1/configurations/{key}
     * Updates a specific configuration
     * Requires WRITE_CONFIG permission
     */
    @PutMapping("/{key}")
    @PreAuthorize("hasAuthority('WRITE_CONFIG')")
    public ResponseEntity<ConfigurationDTO> updateConfiguration(
            @PathVariable String key,
            @RequestBody ConfigurationDTO dto) {
        configService.set(key, dto.getValue());
        
        // Fetch updated entity
        List<SystemConfiguration> all = configService.getAllEntities();
        SystemConfiguration config = all.stream()
            .filter(c -> c.getKey().equals(key))
            .findFirst()
            .orElse(null);
        
        if (config == null) {
            // If doesn't exist, create new
            config = new SystemConfiguration();
            config.setKey(key);
            config.setValue(dto.getValue());
            config.setType(dto.getType() != null ? dto.getType() : "STRING");
            config.setCategory(dto.getCategory());
            config.setDescription(dto.getDescription());
        }
        
        return ResponseEntity.ok(toDTO(config));
    }

    /**
     * POST /api/v1/configurations
     * Creates a new configuration
     * Requires WRITE_CONFIG permission
     */
    @PostMapping
    @PreAuthorize("hasAuthority('WRITE_CONFIG')")
    public ResponseEntity<ConfigurationDTO> createConfiguration(@RequestBody ConfigurationDTO dto) {
        if (dto.getKey() == null || dto.getKey().isEmpty()) {
            return ResponseEntity.badRequest().build();
        }
        
        configService.set(dto.getKey(), dto.getValue());
        
        // Fetch created entity
        List<SystemConfiguration> all = configService.getAllEntities();
        SystemConfiguration config = all.stream()
            .filter(c -> c.getKey().equals(dto.getKey()))
            .findFirst()
            .orElse(null);
        
        return ResponseEntity.status(HttpStatus.CREATED).body(toDTO(config));
    }

    /**
     * Converts entity to DTO
     */
    private ConfigurationDTO toDTO(SystemConfiguration config) {
        ConfigurationDTO dto = new ConfigurationDTO();
        dto.setId(config.getId());
        dto.setKey(config.getKey());
               
        // If password, don't return real value
        if ("PASSWORD".equals(config.getType())) {
            dto.setValue("******");
        } else {
            dto.setValue(config.getValue());
        }
        
        dto.setDescription(config.getDescription());
        dto.setType(config.getType());
        dto.setCategory(config.getCategory());
        return dto;
    }
}

