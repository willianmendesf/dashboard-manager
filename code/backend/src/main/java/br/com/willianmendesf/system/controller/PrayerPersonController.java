package br.com.willianmendesf.system.controller;

import br.com.willianmendesf.system.model.dto.PrayerPersonDTO;
import br.com.willianmendesf.system.service.PrayerPersonService;
import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/prayer360/persons")
@AllArgsConstructor
@Slf4j
public class PrayerPersonController {

    private final PrayerPersonService service;

    @GetMapping
    @PreAuthorize("hasAuthority('READ_PRAYER360')")
    public ResponseEntity<List<PrayerPersonDTO>> getAll() {
        return ResponseEntity.ok(service.getAll());
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAuthority('READ_PRAYER360')")
    public ResponseEntity<PrayerPersonDTO> getById(@PathVariable Long id) {
        return ResponseEntity.ok(service.getById(id));
    }

    @PostMapping
    @PreAuthorize("hasAuthority('WRITE_PRAYER360')")
    public ResponseEntity<PrayerPersonDTO> create(@RequestBody PrayerPersonDTO dto) {
        return ResponseEntity.ok(service.create(dto));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority('WRITE_PRAYER360')")
    public ResponseEntity<PrayerPersonDTO> update(@PathVariable Long id, @RequestBody PrayerPersonDTO dto) {
        return ResponseEntity.ok(service.update(id, dto));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAuthority('WRITE_PRAYER360')")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        service.delete(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/intercessors")
    @PreAuthorize("hasAuthority('READ_PRAYER360')")
    public ResponseEntity<List<PrayerPersonDTO>> getIntercessors() {
        return ResponseEntity.ok(service.getIntercessors());
    }

    @GetMapping("/candidates")
    @PreAuthorize("hasAuthority('READ_PRAYER360')")
    public ResponseEntity<List<PrayerPersonDTO>> getCandidates() {
        return ResponseEntity.ok(service.getCandidates());
    }

    @PostMapping("/sync-members")
    @PreAuthorize("hasAuthority('WRITE_PRAYER360')")
    public ResponseEntity<List<PrayerPersonDTO>> syncMembers(@RequestBody List<Long> memberIds) {
        return ResponseEntity.ok(service.syncFromMembers(memberIds));
    }
}

