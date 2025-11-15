package br.com.willianmendesf.system.controller;

import br.com.willianmendesf.system.model.dto.PrayerCycleDTO;
import br.com.willianmendesf.system.model.dto.PrayerDistributionDTO;
import br.com.willianmendesf.system.service.PrayerCycleService;
import br.com.willianmendesf.system.service.PrayerHistoryService;
import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/prayer360/history")
@AllArgsConstructor
@Slf4j
public class PrayerHistoryController {

    private final PrayerHistoryService historyService;
    private final PrayerCycleService cycleService;

    @GetMapping
    @PreAuthorize("hasAuthority('READ_PRAYER360')")
    public ResponseEntity<Map<String, List<PrayerDistributionDTO>>> getHistory(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
        LocalDate start = startDate != null ? startDate : LocalDate.now().minusMonths(1);
        LocalDate end = endDate != null ? endDate : LocalDate.now();
        return ResponseEntity.ok(historyService.readHistory(start, end));
    }

    @GetMapping("/intercessor/{id}")
    @PreAuthorize("hasAuthority('READ_PRAYER360')")
    public ResponseEntity<List<PrayerDistributionDTO>> getIntercessorHistory(@PathVariable Long id) {
        // TODO: Implementar método no service
        return ResponseEntity.ok(List.of());
    }

    @GetMapping("/cycles")
    @PreAuthorize("hasAuthority('READ_PRAYER360')")
    public ResponseEntity<List<PrayerCycleDTO>> getCycles(@RequestParam(required = false) Long intercessorId) {
        if (intercessorId != null) {
            return ResponseEntity.ok(cycleService.getCyclesByIntercessor(intercessorId));
        }
        // TODO: Implementar método para buscar todos os ciclos
        return ResponseEntity.ok(List.of());
    }

    @GetMapping("/cycles/intercessor/{id}")
    @PreAuthorize("hasAuthority('READ_PRAYER360')")
    public ResponseEntity<List<PrayerCycleDTO>> getCyclesByIntercessor(@PathVariable Long id) {
        return ResponseEntity.ok(cycleService.getCyclesByIntercessor(id));
    }

    @DeleteMapping("/intercessor/{id}")
    @PreAuthorize("hasAuthority('MANAGE_PRAYER360_CONFIG')")
    public ResponseEntity<Void> clearIntercessorHistory(@PathVariable Long id) {
        historyService.clearHistoryFor(id);
        return ResponseEntity.noContent().build();
    }
}

