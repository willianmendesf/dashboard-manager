package br.com.willianmendesf.system.service;

import br.com.willianmendesf.system.cache.AppointmentCache;
import br.com.willianmendesf.system.exception.WhatsappMessageException;
import br.com.willianmendesf.system.model.WhatsappSender;
import br.com.willianmendesf.system.model.entity.AppointmentsEntity;
import br.com.willianmendesf.system.model.enums.RecipientType;
import br.com.willianmendesf.system.model.enums.TaskStatus;
import br.com.willianmendesf.system.repository.AppointmentsRepository;
import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.support.CronExpression;
import org.springframework.stereotype.Service;

import java.sql.Timestamp;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Collection;
import java.util.List;

import static java.util.Objects.isNull;

@Service
@Slf4j
@AllArgsConstructor
public class AppointmentSchedulerService {

    private final AppointmentCache appointmentCache;
    private final AppointmentsRepository appointmentsRepository;
    private final WhatsappMessageService whatsapp;

    public void loadAppointmentsToCache() {
        log.info("Loading all appointments to cache");
        List<AppointmentsEntity> activeAppointments = appointmentsRepository.findByEnabledTrue();
        appointmentCache.loadAppointments(activeAppointments);
        log.info("Loaded {} appointments to cache", activeAppointments.size());
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
        log.info("Enviando mensagem WhatsApp para: {}", appointment.getSendToGroups());

        List<WhatsappSender> messageList = new ArrayList<WhatsappSender>();

        if(appointment.getRecipientType() == RecipientType.INDIVIDUAL) {
            if(!isNull(appointment.getSendTo()) && !appointment.getSendTo().isEmpty()) {
                appointment.getSendTo().forEach(individual -> {
                    WhatsappSender message = new WhatsappSender();
                    message.setPhone(individual);
                    message.setMessage(appointment.getMessage());
                    messageList.add(message);
                });

                messageList.forEach(this.whatsapp::sendMessage);
            } else throw new WhatsappMessageException("Individual List is empty!");
        }

        if(appointment.getRecipientType() == RecipientType.GROUP) {
            if(!isNull(appointment.getSendToGroups()) && !appointment.getSendToGroups().isEmpty()) {
                appointment.getSendToGroups().forEach(group -> {
                    WhatsappSender message = new WhatsappSender();
                    message.setPhone(group);
                    message.setMessage(appointment.getMessage());
                    messageList.add(message);
                });

                messageList.forEach(this.whatsapp::sendMessage);
            } else throw new WhatsappMessageException("Groups List is empty!");
        }
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
