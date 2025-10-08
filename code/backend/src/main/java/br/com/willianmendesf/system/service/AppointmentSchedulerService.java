package br.com.willianmendesf.system.service;

import br.com.willianmendesf.system.cache.AppointmentCache;
import br.com.willianmendesf.system.exception.WhatsappMessageException;
import br.com.willianmendesf.system.model.WhatsappSender;
import br.com.willianmendesf.system.model.entity.AppointmentEntity;
import br.com.willianmendesf.system.model.enums.RecipientType;
import br.com.willianmendesf.system.model.enums.TaskStatus;
import br.com.willianmendesf.system.model.enums.WhatsappMediaType;
import br.com.willianmendesf.system.repository.AppointmentRepository;
import br.com.willianmendesf.system.service.utils.ApiRequest;
import br.com.willianmendesf.system.service.utils.MessagesUtils;
import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;
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
    private final WhatsappMessageService whatsapp;

    public void loadAppointmentsToCache() {
        log.info("Loading all appointments to cache");
        List<AppointmentEntity> activeAppointments = appointmentsRepository.findByEnabledTrue();
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
                    LocalDateTime.of(1970, 1, 1, 0, 0);

            // Calcular o próximo horário de execução
            LocalDateTime nextExecution = cronExpression.next(lastExecTime);

            // Se não houver próxima execução ou se o próximo horário for após o momento atual
            if (nextExecution == null)
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

            appointment.setLastExecution(new Timestamp(System.currentTimeMillis()));
            appointment.setLastStatus(TaskStatus.SUCCESS);
        } catch (Exception e) {
            log.error("Error ao executar agendamento {}: {}", appointment.getId(), e.getMessage(), e);
            appointment.setLastExecution(new Timestamp(System.currentTimeMillis()));
            appointment.setLastStatus(TaskStatus.FAILURE);
        }

        appointmentsRepository.save(appointment);
        appointmentCache.updateCacheAppointment(appointment);
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
