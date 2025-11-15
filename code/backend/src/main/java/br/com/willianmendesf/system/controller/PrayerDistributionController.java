package br.com.willianmendesf.system.controller;

import br.com.willianmendesf.system.model.dto.PrayerDistributionRequest;
import br.com.willianmendesf.system.model.dto.PrayerDistributionResponse;
import br.com.willianmendesf.system.service.PrayerDistributionService;
import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/prayer360/distribute")
@AllArgsConstructor
@Slf4j
public class PrayerDistributionController {

    private final PrayerDistributionService service;

    @PostMapping
    @PreAuthorize("hasAuthority('WRITE_PRAYER360')")
    public ResponseEntity<PrayerDistributionResponse> generateDistribution(@RequestBody PrayerDistributionRequest request) {
        return ResponseEntity.ok(service.generateDistribution(request));
    }
}

