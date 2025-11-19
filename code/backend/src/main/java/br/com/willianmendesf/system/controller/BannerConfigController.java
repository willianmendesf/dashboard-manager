package br.com.willianmendesf.system.controller;

import br.com.willianmendesf.system.model.dto.BannerConfigDTO;
import br.com.willianmendesf.system.service.BannerService;
import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/banners/configs")
@AllArgsConstructor
@Slf4j
public class BannerConfigController {

    private final BannerService bannerService;

    @GetMapping
    @PreAuthorize("hasAuthority('READ_MEMBERS')")
    public ResponseEntity<List<BannerConfigDTO>> getAll() {
        try {
            log.info("Getting all banner configs");
            return ResponseEntity.ok(bannerService.getAllConfigs());
        } catch (Exception e) {
            log.error("Error getting all banner configs", e);
            return ResponseEntity.internalServerError().build();
        }
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAuthority('READ_MEMBERS')")
    public ResponseEntity<BannerConfigDTO> getById(@PathVariable Long id) {
        try {
            log.info("Getting banner config by ID: {}", id);
            return ResponseEntity.ok(bannerService.getConfigById(id));
        } catch (Exception e) {
            log.error("Error getting banner config by ID: {}", id, e);
            return ResponseEntity.notFound().build();
        }
    }

    @PostMapping
    @PreAuthorize("hasAuthority('WRITE_MEMBERS')")
    public ResponseEntity<BannerConfigDTO> create(@RequestBody BannerConfigDTO dto) {
        try {
            log.info("Creating banner config");
            return ResponseEntity.status(HttpStatus.CREATED).body(bannerService.createConfig(dto));
        } catch (Exception e) {
            log.error("Error creating banner config", e);
            return ResponseEntity.badRequest().build();
        }
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority('WRITE_MEMBERS')")
    public ResponseEntity<BannerConfigDTO> update(@PathVariable Long id, @RequestBody BannerConfigDTO dto) {
        try {
            log.info("Updating banner config with ID: {}", id);
            return ResponseEntity.ok(bannerService.updateConfig(id, dto));
        } catch (Exception e) {
            log.error("Error updating banner config with ID: {}", id, e);
            return ResponseEntity.badRequest().build();
        }
    }

    @PatchMapping("/{id}/toggle-active")
    @PreAuthorize("hasAuthority('WRITE_MEMBERS')")
    public ResponseEntity<BannerConfigDTO> toggleActive(@PathVariable Long id) {
        try {
            log.info("Toggling active status for banner config with ID: {}", id);
            return ResponseEntity.ok(bannerService.toggleConfigActive(id));
        } catch (Exception e) {
            log.error("Error toggling active status for banner config with ID: {}", id, e);
            return ResponseEntity.badRequest().build();
        }
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAuthority('WRITE_MEMBERS')")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        try {
            log.info("Deleting banner config with ID: {}", id);
            bannerService.deleteConfig(id);
            return ResponseEntity.noContent().build();
        } catch (Exception e) {
            log.error("Error deleting banner config with ID: {}", id, e);
            return ResponseEntity.badRequest().build();
        }
    }
}

