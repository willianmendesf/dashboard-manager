package br.com.willianmendesf.system.service;

import br.com.willianmendesf.system.cache.AppointmentCache;
import br.com.willianmendesf.system.exception.WhatsappMessageException;
import br.com.willianmendesf.system.model.WhatsappSender;
import br.com.willianmendesf.system.model.entity.AppointmentEntity;
import br.com.willianmendesf.system.model.entity.AppointmentExecution;
import br.com.willianmendesf.system.model.enums.RecipientType;
import br.com.willianmendesf.system.model.enums.TaskStatus;
import br.com.willianmendesf.system.model.enums.WhatsappMediaType;
import br.com.willianmendesf.system.repository.AppointmentExecutionRepository;
import br.com.willianmendesf.system.repository.AppointmentRepository;
import br.com.willianmendesf.system.service.utils.ApiRequest;
import br.com.willianmendesf.system.service.utils.MessagesUtils;
import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.support.CronExpression;
import org.springframework.stereotype.Service;

import java.sql.Timestamp;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Collection;
import java.util.List;

import static java.util.Objects.isNull;

@Service
@Slf4j
@AllArgsConstructor
public class AppointmentSchedulerService {

    private final AppointmentCache appointmentCache;
    private final AppointmentRepository appointmentsRepository;
    private final AppointmentExecutionRepository executionRepository;
    private final WhatsappMessageService whatsapp;

    // Configuração para janela de tempo máxima (em minutos)
    @Value("${scheduler.max.backlog.minutes:5}")
    private int maxBacklogMinutes;

    /**
     * Carrega todos os agendamentos ativos para o cache
     * Atualiza a última execução para evitar processamento de agendamentos antigos
     */
    public void loadAppointmentsToCache() {
        log.info("Loading all appointments to cache");
        List<AppointmentEntity> activeAppointments = appointmentsRepository.findByEnabledTrue();

        // Atualizar a última execução para agendamentos antigos
        LocalDateTime cutoffTime = LocalDateTime.now().minusMinutes(maxBacklogMinutes);

        activeAppointments.forEach(appointment -> {
            if (appointment.getLastExecution() == null ||
                    appointment.getLastExecution().toLocalDateTime().isBefore(cutoffTime)) {
                // Definir a última execução como o tempo de corte para evitar execuções antigas
                appointment.setLastExecution(Timestamp.valueOf(cutoffTime));
                appointmentsRepository.save(appointment);
            }
        });

        appointmentCache.loadAppointments(activeAppointments);
        log.info("Loaded {} appointments to cache", activeAppointments.size());
    }

    public void checkAndExecuteScheduledAppointments() {
        Collection<AppointmentEntity> appointments = appointmentCache.getAllAppointments();
        LocalDateTime now = LocalDateTime.now();

        appointments.stream()
                .filter(appointment -> isAppointmentDueForExecution(appointment, now))
                .forEach(this::executeAppointment);
    }

    /**
     * Verifica se um agendamento deve ser executado no momento atual
     * Implementa a lógica de janela de tempo e verificação de execuções anteriores
     */
    private boolean isAppointmentDueForExecution(AppointmentEntity appointment, LocalDateTime now) {
        if (!Boolean.TRUE.equals(appointment.getEnabled())) {
            return false;
        }

        try {
            // Verificar data de início
            if (!isNull(appointment.getStartDate()) && !appointment.getStartDate().isEmpty()) {
                LocalDate startDate = LocalDate.parse(appointment.getStartDate());
                if (now.toLocalDate().isBefore(startDate)) {
                    return false;
                }
            }

            // Verificar data de fim
            if (!isNull(appointment.getEndDate()) && !appointment.getEndDate().isEmpty()) {
                LocalDate endDate = LocalDate.parse(appointment.getEndDate());
                if (now.toLocalDate().isAfter(endDate)) {
                    return false;
                }
            }

            CronExpression cronExpression = CronExpression.parse(appointment.getSchedule());

            // Obter a última execução com limite de tempo para evitar execuções muito antigas
            LocalDateTime lastExecTime = !isNull(appointment.getLastExecution()) ?
                    appointment.getLastExecution().toLocalDateTime() :
                    now.minusMinutes(maxBacklogMinutes);

            // Aplicar limite de tempo para execuções antigas
            LocalDateTime cutoffTime = now.minusMinutes(maxBacklogMinutes);
            if (lastExecTime.isBefore(cutoffTime)) {
                lastExecTime = cutoffTime;
            }

            // Calcular o próximo horário de execução
            LocalDateTime nextExecution = cronExpression.next(lastExecTime);

            // Se não houver próxima execução ou se o próximo horário for após o momento atual
            if (nextExecution == null)
                return false;

            boolean alreadyExecuted = executionRepository.existsByAppointmentIdAndScheduledTime(
                    appointment.getId(), nextExecution);

            if (alreadyExecuted)
                return false;

            // Verificar se o próximo horário de execução já chegou ou passou
            return !nextExecution.isAfter(now);
        } catch (Exception e) {
            log.error("Erro ao processar agendamento {}: {}", appointment.getId(), e.getMessage(), e);
            return false;
        }
    }

    /**
     * Executa um agendamento específico
     * Registra a execução para evitar duplicações
     */
    private void executeAppointment(AppointmentEntity appointment) {
        log.info("Start execute appointment: {}", appointment.getName());
        LocalDateTime now = LocalDateTime.now();

        try {
            // Calcular o horário agendado específico que está sendo executado
            CronExpression cronExpression = CronExpression.parse(appointment.getSchedule());
            LocalDateTime lastExecTime = !isNull(appointment.getLastExecution()) ?
                    appointment.getLastExecution().toLocalDateTime() :
                    now.minusMinutes(maxBacklogMinutes);

            // Aplicar limite de tempo para execuções antigas
            if (lastExecTime.isBefore(now.minusMinutes(maxBacklogMinutes))) {
                lastExecTime = now.minusMinutes(maxBacklogMinutes);
            }

            LocalDateTime scheduledTime = cronExpression.next(lastExecTime);

            // Criar registro de execução
            AppointmentExecution execution = new AppointmentExecution();
            execution.setAppointmentId(appointment.getId());
            execution.setScheduledTime(scheduledTime);
            execution.setExecutionTime(now);

            // Executar a tarefa conforme o tipo
            switch (appointment.getTaskType()) {
                case WHATSAPP_MESSAGE:
                    executeWhatsAppMessage(appointment);
                    executeMonitoringMessage(appointment);
                    break;
                case API_CALL:
                    executeApiCall(appointment);
                    executeMonitoringMessage(appointment);
                    break;
                default:
                    log.warn("Tipo de tarefa desconhecido para o agendamento: {}", appointment.getId());
                    break;
            }

            // Atualizar status de sucesso
            appointment.setLastExecution(Timestamp.valueOf(now));
            appointment.setLastStatus(TaskStatus.SUCCESS);
            execution.setStatus(TaskStatus.SUCCESS);

            // Salvar registros
            appointmentsRepository.save(appointment);
            executionRepository.save(execution);
            appointmentCache.updateCacheAppointment(appointment);

        } catch (Exception e) {
            log.error("Error ao executar agendamento {}: {}", appointment.getId(), e.getMessage(), e);

            // Atualizar status em caso de erro
            appointment.setLastExecution(Timestamp.valueOf(now));
            appointment.setLastStatus(TaskStatus.FAILURE);

            // Criar registro de execução com falha
            try {
                CronExpression cronExpression = CronExpression.parse(appointment.getSchedule());
                LocalDateTime lastExecTime = !isNull(appointment.getLastExecution()) ?
                        appointment.getLastExecution().toLocalDateTime() :
                        now.minusMinutes(maxBacklogMinutes);

                if (lastExecTime.isBefore(now.minusMinutes(maxBacklogMinutes))) {
                    lastExecTime = now.minusMinutes(maxBacklogMinutes);
                }

                LocalDateTime scheduledTime = cronExpression.next(lastExecTime);

                AppointmentExecution execution = new AppointmentExecution();
                execution.setAppointmentId(appointment.getId());
                execution.setScheduledTime(scheduledTime);
                execution.setExecutionTime(now);
                execution.setStatus(TaskStatus.FAILURE);
                executionRepository.save(execution);
            } catch (Exception ex) {
                log.error("Erro ao registrar falha de execução: {}", ex.getMessage(), ex);
            }

            appointmentsRepository.save(appointment);
            appointmentCache.updateCacheAppointment(appointment);
        }
    }

    /**
     * Executa o envio de mensagens WhatsApp
     */
    private void executeWhatsAppMessage(AppointmentEntity appointment) {
        if(appointment.getRecipientType() == RecipientType.INDIVIDUAL) {
            log.info("Individual message start send!");
            if(!isNull(appointment.getSendTo()) && !appointment.getSendTo().isEmpty()) {
                sendMessages("individual", appointment, appointment.getSendTo());
                log.info("Send message whatsApp to: {}", appointment.getSendTo());
            } else throw new WhatsappMessageException("Individual List is empty!");
        }

        if(appointment.getRecipientType() == RecipientType.GROUP) {
            log.info("Group message start send!");
            if(!isNull(appointment.getSendToGroups()) && !appointment.getSendToGroups().isEmpty()) {
                sendMessages("group", appointment, appointment.getSendToGroups());
                log.info("Send message whatsApp to GroupsList: {}", appointment.getSendToGroups());
            } else throw new WhatsappMessageException("Groups List is empty!");
        }
    }

    /**
     * Executa chamada de API
     */
    private void executeApiCall(AppointmentEntity appointment) {
        log.info("Starting call request to: {}", appointment.getEndpoint());
        ApiRequest.post(appointment.getEndpoint(), null);
    }

    /**
     * Executa o envio de mensagens de monitoramento
     */
    private void executeMonitoringMessage(AppointmentEntity appointment) {
        if (Boolean.TRUE.equals(appointment.getMonitoring()) && !isNull(appointment.getMonitoringNumbers())) {
            log.info("Monitoring message for numbers start send!");
            sendMessages("monitoring", appointment, appointment.getMonitoringNumbers());
            log.info("Monitoring message for numbers sent!");
        }

        if (Boolean.TRUE.equals(appointment.getMonitoringGroups()) && !isNull(appointment.getMonitoringGroupsIds())) {
            log.info("Monitoring message for groups start send!");
            sendMessages("monitoring", appointment, appointment.getMonitoringGroupsIds());
            log.info("Monitoring message for groups sent!");
        }
    }

    /**
     * Envia mensagens para os destinatários
     */
    private void sendMessages(String type, AppointmentEntity appointment, Collection<String> recipients) {
        if (recipients == null || recipients.isEmpty())
            return;

        String monitoringMessage = MessagesUtils.generateMonitoringMessage(appointment);

        recipients.forEach(recipient -> {
            WhatsappSender message = new WhatsappSender();

            if(!type.equals("monitoring")) {
                if(Boolean.TRUE.equals(appointment.getSendImage()) && !isNull(appointment.getImageToSend())) {
                    message.setMedia(appointment.getImageToSend());
                    message.setMediaType(WhatsappMediaType.IMAGE);
                }
                message.setPhone(recipient);
                message.setMessage(appointment.getMessage());
            } else {
                message.setPhone(recipient);
                message.setMessage(monitoringMessage);
            }
            whatsapp.sendMessage(message);
        });
    }
}
