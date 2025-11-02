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

    public void loadAppointmentsToCache() {
        log.info("Loading all appointments to cache");
        List<AppointmentEntity> activeAppointments = appointmentsRepository.findByEnabledTrue();

        // Atualizar a última execução para agendamentos antigos
        LocalDateTime cutoffTime = LocalDateTime.now().minusMinutes(5);

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

    private boolean isAppointmentDueForExecution(AppointmentEntity appointment, LocalDateTime now) {
        if (!Boolean.TRUE.equals(appointment.getEnabled())) {
            return false;
        }

        try {
            if (!isNull(appointment.getStartDate()) && !appointment.getStartDate().isEmpty()) {
                LocalDate startDate = LocalDate.parse(appointment.getStartDate());
                if (now.toLocalDate().isBefore(startDate)) {
                    return false;
                }
            }

            if (!isNull(appointment.getEndDate()) && !appointment.getEndDate().isEmpty()) {
                LocalDate endDate = LocalDate.parse(appointment.getEndDate());
                if (now.toLocalDate().isAfter(endDate)) {
                    return false;
                }
            }

            CronExpression cronExpression = CronExpression.parse(appointment.getSchedule());

            // Obter a última execução ou usar uma data antiga se for a primeira execução
            LocalDateTime lastExecTime = !isNull(appointment.getLastExecution()) ?
                    appointment.getLastExecution().toLocalDateTime() :
                    now.minusMinutes(maxBacklogMinutes);
                    //LocalDateTime.of(1970, 1, 1, 0, 0);

            // Se a última execução for muito antiga, use um limite máximo
            // Isso evita processamento de agendamentos muito antigos após reinicialização
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

    private void executeAppointment(AppointmentEntity appointment) {
        log.info("Start execute appointment: {}", appointment.getName());
        LocalDateTime now = LocalDateTime.now();

        // Verificar se este agendamento específico já foi executado neste horário específico
        CronExpression cronExpression = CronExpression.parse(appointment.getSchedule());
        LocalDateTime lastExecTime = !isNull(appointment.getLastExecution()) ?
                appointment.getLastExecution().toLocalDateTime() :
                now.minusMinutes(maxBacklogMinutes);
                //LocalDateTime.of(1970, 1, 1, 0, 0);

        // Aplicar limite de tempo para execuções antigas
        if (lastExecTime.isBefore(now.minusMinutes(maxBacklogMinutes))) {
            lastExecTime = now.minusMinutes(maxBacklogMinutes);
        }

        LocalDateTime scheduledTime = cronExpression.next(lastExecTime);

        // Verificar se já existe um registro de execução para este agendamento neste horário específico
        boolean alreadyExecuted = executionRepository.existsByAppointmentIdAndScheduledTime(
                appointment.getId(), scheduledTime);

        if (alreadyExecuted) {
            log.info("Agendamento {} já foi executado para o horário {}", appointment.getId(), scheduledTime);
            return;
        }

        // Criar registro de execução
        AppointmentExecution execution = new AppointmentExecution();
        execution.setAppointmentId(appointment.getId());
        execution.setScheduledTime(scheduledTime);
        execution.setExecutionTime(now);

        try {
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
            // Atualizar status
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
                cronExpression = CronExpression.parse(appointment.getSchedule());
                lastExecTime = !isNull(appointment.getLastExecution()) ?
                        appointment.getLastExecution().toLocalDateTime() :
                        now.minusMinutes(maxBacklogMinutes);
                scheduledTime = cronExpression.next(lastExecTime);

                execution = new AppointmentExecution();
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

            //appointment.setLastExecution(Timestamp.valueOf(now));
            //appointment.setLastStatus(TaskStatus.FAILURE);
            //execution.setStatus(TaskStatus.FAILURE);
        }

        //appointmentsRepository.save(appointment);
        //executionRepository.save(execution);
        //appointmentCache.updateCacheAppointment(appointment);
    }

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

    private void executeApiCall(AppointmentEntity appointment) {
        log.info("Starting call request to: {}", appointment.getEndpoint());
        ApiRequest.post(appointment.getEndpoint(), null);
    }

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
