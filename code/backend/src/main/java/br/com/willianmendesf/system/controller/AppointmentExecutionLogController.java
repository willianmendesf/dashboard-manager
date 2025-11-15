package br.com.willianmendesf.system.controller;

import br.com.willianmendesf.system.model.dto.AppointmentExecutionLogDTO;
import br.com.willianmendesf.system.model.enums.TaskStatus;
import br.com.willianmendesf.system.service.AppointmentExecutionLogService;
import lombok.AllArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@AllArgsConstructor
@RequestMapping("/appointments/executions/logs")
public class AppointmentExecutionLogController {

    private final AppointmentExecutionLogService logService;

    @GetMapping
    public ResponseEntity<List<AppointmentExecutionLogDTO>> getLogs(
            @RequestParam(required = false) Long appointmentId,
            @RequestParam(required = false) TaskStatus status) {
        
        List<AppointmentExecutionLogDTO> logs;
        
        if (appointmentId != null) {
            logs = logService.getLogsByAppointmentId(appointmentId);
        } else if (status != null) {
            logs = logService.getLogsByStatus(status);
        } else {
            logs = logService.getAllLogs();
        }
        
        return ResponseEntity.ok(logs);
    }
}

