package br.com.willianmendesf.system.controller;

import br.com.willianmendesf.system.model.dto.AttendanceReportDTO;
import br.com.willianmendesf.system.model.dto.AttendanceStatsDTO;
import br.com.willianmendesf.system.model.dto.EventDTO;
import br.com.willianmendesf.system.model.dto.MemberAttendanceDTO;
import br.com.willianmendesf.system.service.AttendanceService;
import br.com.willianmendesf.system.service.EventService;
import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@RestController
@AllArgsConstructor
@Slf4j
public class AttendanceController {

    private final EventService eventService;
    private final AttendanceService attendanceService;

    @GetMapping("/events")
    public ResponseEntity<List<EventDTO>> getEvents(@RequestParam(required = false) LocalDate date) {
        try {
            log.info("Getting events - date: {}", date);
            // Se não houver data, usa hoje como padrão
            LocalDate targetDate = date != null ? date : LocalDate.now();
            List<EventDTO> events = eventService.getAll(targetDate);
            log.info("Returning {} events for date: {}", events.size(), targetDate);
            return ResponseEntity.ok(events);
        } catch (Exception e) {
            log.error("Error getting events for date: {}", date, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @PostMapping("/events")
    @PreAuthorize("hasAuthority('WRITE_MEMBERS')")
    public ResponseEntity<EventDTO> createEvent(@RequestBody EventDTO dto) {
        try {
            log.info("Creating event: {}", dto.getName());
            EventDTO created = eventService.create(dto);
            return ResponseEntity.status(HttpStatus.CREATED).body(created);
        } catch (Exception e) {
            log.error("Error creating event", e);
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
        }
    }

    @PostMapping("/attendance/toggle")
    public ResponseEntity<Map<String, Object>> toggleAttendance(@RequestBody Map<String, Long> request) {
        try {
            Long memberId = request.get("memberId");
            Long eventId = request.get("eventId");
            
            if (memberId == null || eventId == null) {
                return ResponseEntity.badRequest().body(Map.of("error", "memberId e eventId são obrigatórios"));
            }
            
            log.info("Toggling attendance - memberId: {}, eventId: {}", memberId, eventId);
            Boolean isPresent = attendanceService.toggleAttendance(memberId, eventId);
            return ResponseEntity.ok(Map.of("isPresent", isPresent));
        } catch (Exception e) {
            log.error("Error toggling attendance", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Erro ao atualizar presença: " + e.getMessage()));
        }
    }

    @GetMapping("/attendance/event/{eventId}/members")
    public ResponseEntity<List<MemberAttendanceDTO>> getMembersByEvent(@PathVariable Long eventId) {
        try {
            log.info("Getting members for event: {}", eventId);
            List<MemberAttendanceDTO> members = attendanceService.getMembersByEvent(eventId);
            return ResponseEntity.ok(members);
        } catch (Exception e) {
            log.error("Error getting members for event: {}", eventId, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @GetMapping("/attendance/stats")
    @PreAuthorize("hasAuthority('READ_MEMBERS')")
    public ResponseEntity<AttendanceStatsDTO> getStats(
            @RequestParam LocalDate startDate,
            @RequestParam LocalDate endDate) {
        try {
            log.info("Getting attendance stats - startDate: {}, endDate: {}", startDate, endDate);
            AttendanceStatsDTO stats = attendanceService.getStats(startDate, endDate);
            return ResponseEntity.ok(stats);
        } catch (Exception e) {
            log.error("Error getting attendance stats", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @GetMapping("/attendance/report")
    @PreAuthorize("hasAuthority('READ_MEMBERS')")
    public ResponseEntity<List<AttendanceReportDTO>> getReport(
            @RequestParam LocalDate startDate,
            @RequestParam LocalDate endDate,
            @RequestParam(required = false) Integer minPresence,
            @RequestParam(required = false) Integer maxPresence,
            @RequestParam(required = false) Integer minAbsence,
            @RequestParam(required = false) Integer maxAbsence) {
        try {
            log.info("Getting attendance report - startDate: {}, endDate: {}", startDate, endDate);
            List<AttendanceReportDTO> report = attendanceService.getReport(
                    startDate, endDate, minPresence, maxPresence, minAbsence, maxAbsence);
            return ResponseEntity.ok(report);
        } catch (Exception e) {
            log.error("Error getting attendance report", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
}

