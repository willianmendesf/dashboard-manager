package br.com.willianmendesf.system.controller;

import br.com.willianmendesf.system.model.dto.PrayerTemplateDTO;
import br.com.willianmendesf.system.service.PrayerTemplateService;
import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/prayer360/templates")
@AllArgsConstructor
@Slf4j
public class PrayerTemplateController {

    private final PrayerTemplateService service;

    @GetMapping
    @PreAuthorize("hasAuthority('READ_PRAYER360')")
    public ResponseEntity<List<PrayerTemplateDTO>> getAll() {
        return ResponseEntity.ok(service.getAll());
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAuthority('READ_PRAYER360')")
    public ResponseEntity<PrayerTemplateDTO> getById(@PathVariable Long id) {
        return ResponseEntity.ok(service.getById(id));
    }

    @GetMapping("/default")
    @PreAuthorize("hasAuthority('READ_PRAYER360')")
    public ResponseEntity<PrayerTemplateDTO> getDefault() {
        return ResponseEntity.ok(service.getDefault());
    }

    @PostMapping
    @PreAuthorize("hasAuthority('MANAGE_PRAYER360_CONFIG')")
    public ResponseEntity<PrayerTemplateDTO> create(@RequestBody PrayerTemplateDTO dto) {
        return ResponseEntity.ok(service.create(dto));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority('MANAGE_PRAYER360_CONFIG')")
    public ResponseEntity<PrayerTemplateDTO> update(@PathVariable Long id, @RequestBody PrayerTemplateDTO dto) {
        return ResponseEntity.ok(service.update(id, dto));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAuthority('MANAGE_PRAYER360_CONFIG')")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        service.delete(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{id}/set-default")
    @PreAuthorize("hasAuthority('MANAGE_PRAYER360_CONFIG')")
    public ResponseEntity<Void> setDefault(@PathVariable Long id) {
        service.setDefault(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/preview")
    @PreAuthorize("hasAuthority('READ_PRAYER360')")
    public ResponseEntity<String> preview(@RequestParam Long id, @RequestBody(required = false) Map<String, String> variables) {
        return ResponseEntity.ok(service.preview(id, variables != null ? variables : Map.of()));
    }
}

