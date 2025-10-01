package br.com.willianmendesf.system.service;

import br.com.willianmendesf.system.cache.AppointmentCache;
import br.com.willianmendesf.system.model.entity.AppointmentsEntity;
import br.com.willianmendesf.system.model.enums.TaskStatus;
import br.com.willianmendesf.system.repository.AppointmentsRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.sql.Timestamp;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Collection;
import java.util.List;

@Service
@Slf4j
public class AppointmentSchedulerService {
    private final AppointmentsRepository appointmentsRepository;
    private final AppointmentCache appointmentCache;

    @Autowired
    public AppointmentSchedulerService(
            AppointmentsRepository appointmentsRepository,
            AppointmentCache appointmentCache
    ) {
        this.appointmentsRepository = appointmentsRepository;
        this.appointmentCache = appointmentCache;
    }

    /**
     * Carrega todos os agendamentos ativos para o cache em memória
     */
    public void loadAppointmentsToCache() {
        log.info("Carregando agendamentos para o cache");
        List<AppointmentsEntity> activeAppointments = appointmentsRepository.findByEnabledTrue();
        appointmentCache.loadAppointments(activeAppointments);
        log.info("Carregados {} agendamentos para o cache", activeAppointments.size());
    }

    /**
     * Verifica e executa os agendamentos programados para o momento atual
     */
    public void checkAndExecuteScheduledAppointments() {
        Collection<AppointmentsEntity> appointments = appointmentCache.getAllAppointments();
        LocalDateTime now = LocalDateTime.now();

        appointments.stream()
                .filter(appointment -> isAppointmentDueForExecution(appointment, now))
                .forEach(this::executeAppointment);
    }

    /**
     * Verifica se um agendamento deve ser executado no momento atual
     */
    private boolean isAppointmentDueForExecution(AppointmentsEntity appointment, LocalDateTime now) {
        if (!Boolean.TRUE.equals(appointment.getEnabled())) {
            return false;
        }

        try {
            // Verificar datas de início e fim se estiverem definidas
            if (appointment.getStartDate() != null && !appointment.getStartDate().isEmpty()) {
                LocalDate startDate = LocalDate.parse(appointment.getStartDate());
                if (now.toLocalDate().isBefore(startDate)) {
                    return false;
                }
            }

            if (appointment.getEndDate() != null && !appointment.getEndDate().isEmpty()) {
                LocalDate endDate = LocalDate.parse(appointment.getEndDate());
                if (now.toLocalDate().isAfter(endDate)) {
                    return false;
                }
            }

            // Usar a implementação correta do Spring para expressões cron
            org.springframework.scheduling.support.CronExpression cronExpression =
                    org.springframework.scheduling.support.CronExpression.parse(appointment.getSchedule());

            // Obter a última execução ou usar uma data antiga se for a primeira execução
            LocalDateTime lastExecTime = appointment.getLastExecution() != null ?
                    appointment.getLastExecution().toLocalDateTime() :
                    LocalDateTime.of(1970, 1, 1, 0, 0);

            // Calcular o próximo horário de execução
            LocalDateTime nextExecution = cronExpression.next(lastExecTime);

            // Se não houver próxima execução ou se o próximo horário for após o momento atual
            if (nextExecution == null) {
                return false;
            }

            // Verificar se o próximo horário de execução já chegou ou passou
            return !nextExecution.isAfter(now);
        } catch (Exception e) {
            log.error("Erro ao processar agendamento {}: {}", appointment.getId(), e.getMessage(), e);
            return false;
        }
    }


    /**
     * Executa um agendamento específico
     */
    private void executeAppointment(AppointmentsEntity appointment) {
        log.info("Executando agendamento: {}", appointment.getName());

        try {
            // Aqui você implementará a lógica específica com base no tipo de tarefa
            switch (appointment.getTaskType()) {
                case WHATSAPP_MESSAGE:
                    executeWhatsAppMessage(appointment);
                    break;
                case API_CALL:
                    executeApiCall(appointment);
                    break;
                default:
                    log.warn("Tipo de tarefa desconhecido para o agendamento: {}", appointment.getId());
                    break;
            }

            // Atualizar status de execução
            appointment.setLastExecution(new Timestamp(System.currentTimeMillis()));
            appointment.setLastStatus(TaskStatus.SUCCESS);
        } catch (Exception e) {
            log.error("Erro ao executar agendamento {}: {}", appointment.getId(), e.getMessage(), e);
            appointment.setLastExecution(new Timestamp(System.currentTimeMillis()));
            appointment.setLastStatus(TaskStatus.FAILURE);
        }

        // Persistir o status no banco de dados
        appointmentsRepository.save(appointment);

        // Atualizar o cache
        appointmentCache.updateAppointment(appointment);
    }

    /**
     * Executa uma mensagem de WhatsApp
     */
    private void executeWhatsAppMessage(AppointmentsEntity appointment) {
        // Implementar lógica para enviar mensagem de WhatsApp
        log.info("Enviando mensagem WhatsApp para: {}", appointment.getMonitoringNumbers());
        // Sua lógica aqui...
    }

    /**
     * Executa uma chamada de API
     */
    private void executeApiCall(AppointmentsEntity appointment) {
        // Implementar lógica para chamada de API
        log.info("Fazendo chamada de API para: {}", appointment.getEndpoint());
        // Sua lógica aqui...
    }
}
