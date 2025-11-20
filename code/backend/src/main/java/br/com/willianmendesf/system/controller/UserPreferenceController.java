package br.com.willianmendesf.system.controller;

import br.com.willianmendesf.system.model.dto.AttendanceChartPreferenceDTO;
import br.com.willianmendesf.system.model.dto.VisitorChartPreferenceDTO;
import br.com.willianmendesf.system.model.entity.User;
import br.com.willianmendesf.system.service.UserPreferenceService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/user-preferences")
@RequiredArgsConstructor
@Slf4j
public class UserPreferenceController {

    private final UserPreferenceService preferenceService;

    @GetMapping("/visitor-chart")
    @PreAuthorize("hasAuthority('READ_VISITORS')")
    public ResponseEntity<VisitorChartPreferenceDTO> getVisitorChartPreference(Authentication authentication) {
        try {
            User loggedUser = (User) authentication.getPrincipal();
            VisitorChartPreferenceDTO preference = preferenceService.getVisitorChartPreference(loggedUser);
            return ResponseEntity.ok(preference != null ? preference : new VisitorChartPreferenceDTO());
        } catch (Exception e) {
            log.error("Error getting visitor chart preference", e);
            return ResponseEntity.status(500).build();
        }
    }

    @PostMapping("/visitor-chart")
    @PreAuthorize("hasAuthority('READ_VISITORS')")
    public ResponseEntity<Void> saveVisitorChartPreference(
            @RequestBody VisitorChartPreferenceDTO preference,
            Authentication authentication) {
        try {
            User loggedUser = (User) authentication.getPrincipal();
            preferenceService.saveVisitorChartPreference(loggedUser, preference);
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            log.error("Error saving visitor chart preference", e);
            return ResponseEntity.status(500).build();
        }
    }

    @DeleteMapping("/visitor-chart")
    @PreAuthorize("hasAuthority('READ_VISITORS')")
    public ResponseEntity<Void> deleteVisitorChartPreference(Authentication authentication) {
        try {
            User loggedUser = (User) authentication.getPrincipal();
            preferenceService.deleteVisitorChartPreference(loggedUser);
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            log.error("Error deleting visitor chart preference", e);
            return ResponseEntity.status(500).build();
        }
    }

    @GetMapping("/attendance-chart")
    @PreAuthorize("hasAuthority('READ_MEMBERS')")
    public ResponseEntity<AttendanceChartPreferenceDTO> getAttendanceChartPreference(Authentication authentication) {
        try {
            User loggedUser = (User) authentication.getPrincipal();
            AttendanceChartPreferenceDTO preference = preferenceService.getAttendanceChartPreference(loggedUser);
            return ResponseEntity.ok(preference != null ? preference : new AttendanceChartPreferenceDTO());
        } catch (Exception e) {
            log.error("Error getting attendance chart preference", e);
            return ResponseEntity.status(500).build();
        }
    }

    @PostMapping("/attendance-chart")
    @PreAuthorize("hasAuthority('READ_MEMBERS')")
    public ResponseEntity<Void> saveAttendanceChartPreference(
            @RequestBody AttendanceChartPreferenceDTO preference,
            Authentication authentication) {
        try {
            User loggedUser = (User) authentication.getPrincipal();
            preferenceService.saveAttendanceChartPreference(loggedUser, preference);
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            log.error("Error saving attendance chart preference", e);
            return ResponseEntity.status(500).build();
        }
    }

    @DeleteMapping("/attendance-chart")
    @PreAuthorize("hasAuthority('READ_MEMBERS')")
    public ResponseEntity<Void> deleteAttendanceChartPreference(Authentication authentication) {
        try {
            User loggedUser = (User) authentication.getPrincipal();
            preferenceService.deleteAttendanceChartPreference(loggedUser);
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            log.error("Error deleting attendance chart preference", e);
            return ResponseEntity.status(500).build();
        }
    }
}

