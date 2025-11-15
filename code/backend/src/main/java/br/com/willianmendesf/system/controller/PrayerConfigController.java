package br.com.willianmendesf.system.controller;

import br.com.willianmendesf.system.model.dto.PrayerConfigDTO;
import br.com.willianmendesf.system.service.PrayerConfigService;
import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/prayer360/config")
@AllArgsConstructor
@Slf4j
public class PrayerConfigController {

    private final PrayerConfigService service;

    @GetMapping
    @PreAuthorize("hasAuthority('READ_PRAYER360')")
    public ResponseEntity<PrayerConfigDTO> getConfig() {
        return ResponseEntity.ok(service.getConfig());
    }

    @PutMapping
    @PreAuthorize("hasAuthority('MANAGE_PRAYER360_CONFIG')")
    public ResponseEntity<Void> updateConfig(@RequestBody PrayerConfigDTO config) {
        service.updateConfig(config);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/reset")
    @PreAuthorize("hasAuthority('MANAGE_PRAYER360_CONFIG')")
    public ResponseEntity<Void> resetConfig() {
        service.resetToDefault();
        return ResponseEntity.noContent().build();
    }
}

