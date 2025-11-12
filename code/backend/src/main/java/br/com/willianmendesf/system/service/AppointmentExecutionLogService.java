package br.com.willianmendesf.system.service;

import br.com.willianmendesf.system.model.dto.AppointmentExecutionLogDTO;
import br.com.willianmendesf.system.model.entity.AppointmentExecution;
import br.com.willianmendesf.system.model.entity.AppointmentEntity;
import br.com.willianmendesf.system.model.enums.TaskStatus;
import br.com.willianmendesf.system.repository.AppointmentExecutionRepository;
import br.com.willianmendesf.system.repository.AppointmentRepository;
import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

@Slf4j
@Service
@AllArgsConstructor
public class AppointmentExecutionLogService {

    private final AppointmentExecutionRepository executionRepository;
    private final AppointmentRepository appointmentRepository;

    public List<AppointmentExecutionLogDTO> getAllLogs() {
        try {
            log.info("Fetching all appointment execution logs");
            List<AppointmentExecution> executions = executionRepository.findAllByOrderByExecutionTimeDesc();
            return mapToDTOs(executions);
        } catch (Exception e) {
            log.error("Error fetching all execution logs: {}", e.getMessage(), e);
            throw new RuntimeException("Error fetching execution logs: " + e.getMessage(), e);
        }
    }

    public List<AppointmentExecutionLogDTO> getLogsByAppointmentId(Long appointmentId) {
        try {
            log.info("Fetching execution logs for appointment ID: {}", appointmentId);
            List<AppointmentExecution> executions = executionRepository.findByAppointmentIdOrderByExecutionTimeDesc(appointmentId);
            return mapToDTOs(executions);
        } catch (Exception e) {
            log.error("Error fetching execution logs for appointment {}: {}", appointmentId, e.getMessage(), e);
            throw new RuntimeException("Error fetching execution logs: " + e.getMessage(), e);
        }
    }

    public List<AppointmentExecutionLogDTO> getLogsByStatus(TaskStatus status) {
        try {
            log.info("Fetching execution logs with status: {}", status);
            List<AppointmentExecution> executions = executionRepository.findByStatusOrderByExecutionTimeDesc(status);
            return mapToDTOs(executions);
        } catch (Exception e) {
            log.error("Error fetching execution logs with status {}: {}", status, e.getMessage(), e);
            throw new RuntimeException("Error fetching execution logs: " + e.getMessage(), e);
        }
    }

    private List<AppointmentExecutionLogDTO> mapToDTOs(List<AppointmentExecution> executions) {
        if (executions.isEmpty()) {
            return List.of();
        }

        // Buscar todos os appointmentIds únicos
        Set<Long> appointmentIds = executions.stream()
                .map(AppointmentExecution::getAppointmentId)
                .collect(Collectors.toSet());

        // Buscar todos os agendamentos de uma vez
        Map<Long, String> appointmentNames = appointmentRepository.findAllById(appointmentIds)
                .stream()
                .collect(Collectors.toMap(
                        AppointmentEntity::getId,
                        AppointmentEntity::getName
                ));

        // Mapear para DTOs
        return executions.stream()
                .map(execution -> {
                    String appointmentName = appointmentNames.getOrDefault(execution.getAppointmentId(), null);
                    return new AppointmentExecutionLogDTO(execution, appointmentName);
                })
                .collect(Collectors.toList());
    }
}

