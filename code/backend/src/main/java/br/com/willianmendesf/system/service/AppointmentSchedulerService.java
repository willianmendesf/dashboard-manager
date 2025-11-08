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
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.dao.OptimisticLockingFailureException;
import org.springframework.scheduling.support.CronExpression;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.sql.Timestamp;
import java.time.Duration;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Collection;
import java.util.List;
import java.util.Optional;

import static java.util.Objects.isNull;

@Service
@Slf4j
@RequiredArgsConstructor
public class AppointmentSchedulerService {

    private final AppointmentCache appointmentCache;
    private final AppointmentRepository appointmentsRepository;
    private final AppointmentExecutionRepository executionRepository;
    private final WhatsappMessageService whatsapp;

    // Configuração para janela de tempo máxima (em minutos)
    @Value("${scheduler.max.backlog.minutes:5}")
    private int maxBacklogMinutes;

    // Limiar de recorrência para catch-up (em minutos) - agendamentos com recorrência maior que este valor serão reenviados
    @Value("${scheduler.catchup.recurrence.threshold.minutes:60}")
    private int catchupRecurrenceThresholdMinutes;

    /**
     * Carrega todos os agendamentos ativos para o cache
     * Atualiza a última execução para evitar processamento de agendamentos antigos
     * @param isStartup Indica se é a inicialização da aplicação (para executar catch-up)
     */
    public void loadAppointmentsToCache(boolean isStartup) {
        log.info("Loading all appointments to cache (startup: {})", isStartup);
        List<AppointmentEntity> activeAppointments = appointmentsRepository.findByEnabledTrue();

        // Se for inicialização, processar catch-up inteligente antes de carregar no cache
        if (isStartup) {
            log.info("Processing intelligent catch-up for missed appointments during downtime");
            processIntelligentCatchUp(activeAppointments);
        } else {
            // Atualizar a última execução para agendamentos antigos (comportamento normal)
            LocalDateTime cutoffTime = LocalDateTime.now().minusMinutes(maxBacklogMinutes);

            activeAppointments.forEach(appointment -> {
                if (appointment.getLastExecution() == null ||
                        appointment.getLastExecution().toLocalDateTime().isBefore(cutoffTime)) {
                    // Definir a última execução como o tempo de corte para evitar execuções antigas
                    appointment.setLastExecution(Timestamp.valueOf(cutoffTime));
                    appointmentsRepository.save(appointment);
                }
            });
        }

        appointmentCache.loadAppointments(activeAppointments);
        log.info("Loaded {} appointments to cache", activeAppointments.size());
    }

    /**
     * Sobrecarga do método para manter compatibilidade (assume que não é startup)
     */
    public void loadAppointmentsToCache() {
        loadAppointmentsToCache(false);
    }

    /**
     * Processa catch-up inteligente para agendamentos perdidos durante o downtime
     * Aplica a regra: reenvia apenas agendamentos com recorrência > limiar (padrão: 1 hora)
     */
    private void processIntelligentCatchUp(List<AppointmentEntity> appointments) {
        LocalDateTime now = LocalDateTime.now();
        int processedCount = 0;
        int executedCount = 0;
        int skippedCount = 0;

        for (AppointmentEntity appointment : appointments) {
            if (!Boolean.TRUE.equals(appointment.getEnabled())) {
                continue;
            }

            try {
                // Calcular período de downtime
                LocalDateTime lastExecution = appointment.getLastExecution() != null ?
                        appointment.getLastExecution().toLocalDateTime() : null;

                // Se nunca foi executado, usar um período máximo razoável (ex: 24 horas atrás)
                LocalDateTime downtimeStart = lastExecution != null ?
                        lastExecution : now.minusHours(24);

                // Não processar se a última execução foi muito recente (menos de 1 minuto)
                if (lastExecution != null && Duration.between(lastExecution, now).toMinutes() < 1) {
                    continue;
                }

                // Calcular recorrência mínima do cron
                int minRecurrenceMinutes = calculateMinRecurrenceMinutes(appointment.getSchedule());

                // Se a recorrência for menor ou igual ao limiar, ignorar agendamentos perdidos
                if (minRecurrenceMinutes <= catchupRecurrenceThresholdMinutes) {
                    log.debug("Skipping catch-up for appointment {} (recurrence: {} min <= threshold: {} min)",
                            appointment.getName(), minRecurrenceMinutes, catchupRecurrenceThresholdMinutes);
                    skippedCount++;
                    continue;
                }

                // Encontrar execuções perdidas no período de downtime
                List<LocalDateTime> missedExecutions = findMissedExecutions(
                        appointment, downtimeStart, now);

                // Executar apenas as que não foram executadas anteriormente
                for (LocalDateTime missedTime : missedExecutions) {
                    // Verificar se já foi executado
                    boolean alreadyExecuted = executionRepository.existsByAppointmentIdAndScheduledTime(
                            appointment.getId(), missedTime);

                    if (!alreadyExecuted) {
                        log.info("Executing missed appointment: {} (scheduled: {}, recurrence: {} min)",
                                appointment.getName(), missedTime, minRecurrenceMinutes);
                        executeAppointmentAtTime(appointment, missedTime);
                        executedCount++;
                    } else {
                        log.debug("Skipping already executed appointment: {} at {}", appointment.getName(), missedTime);
                    }
                }

                processedCount++;
            } catch (Exception e) {
                log.error("Error processing catch-up for appointment {}: {}", appointment.getId(), e.getMessage(), e);
            }
        }

        log.info("Catch-up completed: processed={}, executed={}, skipped={}", processedCount, executedCount, skippedCount);
    }

    /**
     * Calcula a recorrência mínima (em minutos) de uma expressão cron
     * Retorna o menor intervalo possível entre duas execuções consecutivas
     */
    private int calculateMinRecurrenceMinutes(String cronExpression) {
        try {
            CronExpression cron = CronExpression.parse(cronExpression);
            LocalDateTime baseTime = LocalDateTime.now();

            // Encontrar a próxima execução
            LocalDateTime next1 = cron.next(baseTime);
            if (next1 == null) {
                return Integer.MAX_VALUE; // Não há próxima execução
            }

            // Encontrar a execução após a próxima
            LocalDateTime next2 = cron.next(next1);
            if (next2 == null) {
                return Integer.MAX_VALUE;
            }

            // Calcular diferença em minutos
            long minutes = Duration.between(next1, next2).toMinutes();
            return (int) Math.max(1, minutes); // Mínimo 1 minuto
        } catch (Exception e) {
            log.error("Error calculating recurrence for cron {}: {}", cronExpression, e.getMessage());
            return Integer.MAX_VALUE; // Em caso de erro, assumir recorrência muito alta (não executar)
        }
    }

    /**
     * Encontra todas as execuções perdidas no período de downtime
     */
    private List<LocalDateTime> findMissedExecutions(AppointmentEntity appointment,
                                                      LocalDateTime downtimeStart,
                                                      LocalDateTime now) {
        List<LocalDateTime> missedExecutions = new java.util.ArrayList<>();

        try {
            CronExpression cronExpression = CronExpression.parse(appointment.getSchedule());
            LocalDateTime current = downtimeStart;

            // Encontrar a primeira execução após o início do downtime
            LocalDateTime nextExecution = cronExpression.next(current);
            if (nextExecution == null) {
                return missedExecutions;
            }

            // Coletar todas as execuções até agora
            while (nextExecution != null && !nextExecution.isAfter(now)) {
                // Verificar se está dentro do período válido do agendamento
                if (isWithinValidPeriod(appointment, nextExecution)) {
                    missedExecutions.add(nextExecution);
                }
                nextExecution = cronExpression.next(nextExecution);
            }
        } catch (Exception e) {
            log.error("Error finding missed executions for appointment {}: {}", appointment.getId(), e.getMessage(), e);
        }

        return missedExecutions;
    }

    /**
     * Verifica se uma data está dentro do período válido do agendamento
     */
    private boolean isWithinValidPeriod(AppointmentEntity appointment, LocalDateTime dateTime) {
        LocalDate date = dateTime.toLocalDate();

        // Verificar data de início
        if (!isNull(appointment.getStartDate()) && !appointment.getStartDate().isEmpty()) {
            LocalDate startDate = LocalDate.parse(appointment.getStartDate());
            if (date.isBefore(startDate)) {
                return false;
            }
        }

        // Verificar data de fim
        if (!isNull(appointment.getEndDate()) && !appointment.getEndDate().isEmpty()) {
            LocalDate endDate = LocalDate.parse(appointment.getEndDate());
            if (date.isAfter(endDate)) {
                return false;
            }
        }

        return true;
    }

    /**
     * Executa um agendamento em um horário específico (para catch-up)
     */
    private void executeAppointmentAtTime(AppointmentEntity appointment, LocalDateTime scheduledTime) {
        log.info("Executing catch-up appointment: {} at scheduled time: {}", appointment.getName(), scheduledTime);
        LocalDateTime now = LocalDateTime.now();

        try {
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

            // Salvar registros de forma segura (tratando optimistic locking)
            saveAppointmentSafely(appointment);
            executionRepository.save(execution);
            appointmentCache.updateCacheAppointment(appointment);

            log.info("Successfully executed catch-up appointment: {} at {}", appointment.getName(), scheduledTime);

        } catch (Exception e) {
            log.error("Error executing catch-up appointment {} at {}: {}", appointment.getId(), scheduledTime, e.getMessage(), e);

            // Atualizar status em caso de erro
            appointment.setLastExecution(Timestamp.valueOf(now));
            appointment.setLastStatus(TaskStatus.FAILURE);

            // Criar registro de execução com falha
            try {
                AppointmentExecution execution = new AppointmentExecution();
                execution.setAppointmentId(appointment.getId());
                execution.setScheduledTime(scheduledTime);
                execution.setExecutionTime(now);
                execution.setStatus(TaskStatus.FAILURE);
                executionRepository.save(execution);
            } catch (Exception ex) {
                log.error("Erro ao registrar falha de execução: {}", ex.getMessage(), ex);
            }

            saveAppointmentSafely(appointment);
            appointmentCache.updateCacheAppointment(appointment);
        }
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

            // Calcular o próximo horário de execução baseado na última execução agendada
            LocalDateTime nextExecution = cronExpression.next(lastExecTime);

            // Se não houver próxima execução ou se o próximo horário for após o momento atual
            if (nextExecution == null)
                return false;

            // Verificar se já foi executado para este horário agendado específico
            boolean alreadyExecuted = executionRepository.existsByAppointmentIdAndScheduledTime(
                    appointment.getId(), nextExecution);

            if (alreadyExecuted) {
                log.debug("Appointment {} already executed for scheduled time: {}", 
                        appointment.getId(), nextExecution);
                return false;
            }

            // Verificar se o próximo horário de execução já chegou ou passou
            // Usar uma pequena margem de tolerância (até 5 segundos após o horário agendado) para evitar problemas de timing
            boolean isDue = !nextExecution.isAfter(now);
            
            if (isDue) {
                long secondsSinceScheduled = Duration.between(nextExecution, now).getSeconds();
                // Se passou mais de 5 segundos do horário agendado, não executar (pode ser uma execução perdida)
                if (secondsSinceScheduled > 5) {
                    log.debug("Appointment {} scheduled time {} passed more than 5 seconds ago ({}s), skipping", 
                            appointment.getId(), nextExecution, secondsSinceScheduled);
                    return false;
                }
            }
            
            if (isDue) {
                log.debug("Appointment {} is due for execution. Scheduled: {}, Now: {}", 
                        appointment.getId(), nextExecution, now);
            }
            
            return isDue;
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
            // IMPORTANTE: Usar scheduledTime ao invés de now para garantir que o próximo cálculo seja correto
            // Isso garante que agendamentos como "0 */10 20 * * *" executem exatamente a cada 10 minutos
            appointment.setLastExecution(Timestamp.valueOf(scheduledTime));
            appointment.setLastStatus(TaskStatus.SUCCESS);
            execution.setStatus(TaskStatus.SUCCESS);

            // Salvar registros de forma segura (tratando optimistic locking)
            saveAppointmentSafely(appointment);
            executionRepository.save(execution);
            appointmentCache.updateCacheAppointment(appointment);

        } catch (Exception e) {
            log.error("Error ao executar agendamento {}: {}", appointment.getId(), e.getMessage(), e);

            // Calcular o scheduledTime para usar no lastExecution mesmo em caso de erro
            LocalDateTime scheduledTimeForError = null;
            try {
                CronExpression cronExpression = CronExpression.parse(appointment.getSchedule());
                LocalDateTime lastExecTime = !isNull(appointment.getLastExecution()) ?
                        appointment.getLastExecution().toLocalDateTime() :
                        now.minusMinutes(maxBacklogMinutes);
                if (lastExecTime.isBefore(now.minusMinutes(maxBacklogMinutes))) {
                    lastExecTime = now.minusMinutes(maxBacklogMinutes);
                }
                scheduledTimeForError = cronExpression.next(lastExecTime);
            } catch (Exception ex) {
                log.warn("Could not calculate scheduledTime for error handling: {}", ex.getMessage());
            }

            // Atualizar status em caso de erro
            // Usar scheduledTime se disponível, senão usar now como fallback
            appointment.setLastExecution(Timestamp.valueOf(scheduledTimeForError != null ? scheduledTimeForError : now));
            appointment.setLastStatus(TaskStatus.FAILURE);

            // Criar registro de execução com falha
            try {
                // Usar o scheduledTime calculado anteriormente se disponível
                LocalDateTime scheduledTime = scheduledTimeForError != null ? scheduledTimeForError : null;
                
                if (scheduledTime == null) {
                    CronExpression cronExpression = CronExpression.parse(appointment.getSchedule());
                    LocalDateTime lastExecTime = !isNull(appointment.getLastExecution()) ?
                            appointment.getLastExecution().toLocalDateTime() :
                            now.minusMinutes(maxBacklogMinutes);

                    if (lastExecTime.isBefore(now.minusMinutes(maxBacklogMinutes))) {
                        lastExecTime = now.minusMinutes(maxBacklogMinutes);
                    }

                    scheduledTime = cronExpression.next(lastExecTime);
                }

                AppointmentExecution execution = new AppointmentExecution();
                execution.setAppointmentId(appointment.getId());
                execution.setScheduledTime(scheduledTime);
                execution.setExecutionTime(now);
                execution.setStatus(TaskStatus.FAILURE);
                executionRepository.save(execution);
            } catch (Exception ex) {
                log.error("Erro ao registrar falha de execução: {}", ex.getMessage(), ex);
            }

            saveAppointmentSafely(appointment);
            appointmentCache.updateCacheAppointment(appointment);
        }
    }

    /**
     * Salva um agendamento de forma segura, recarregando do banco antes de salvar
     * para evitar conflitos de optimistic locking quando múltiplas threads tentam atualizar
     */
    @Transactional
    private void saveAppointmentSafely(AppointmentEntity appointment) {
        try {
            // Recarregar a entidade do banco para ter a versão mais recente
            Optional<AppointmentEntity> freshEntity = appointmentsRepository.findById(appointment.getId());
            
            if (freshEntity.isPresent()) {
                AppointmentEntity entityToSave = freshEntity.get();
                // Atualizar apenas os campos que mudaram
                entityToSave.setLastExecution(appointment.getLastExecution());
                entityToSave.setLastStatus(appointment.getLastStatus());
                appointmentsRepository.save(entityToSave);
                
                // Atualizar o objeto original com a versão atualizada
                appointment.setVersion(entityToSave.getVersion());
            } else {
                log.warn("Appointment {} not found in database, skipping save", appointment.getId());
            }
        } catch (OptimisticLockingFailureException e) {
            // Se ainda houver conflito, apenas logar e continuar
            // A próxima execução do scheduler tentará novamente
            log.warn("Optimistic locking conflict for appointment {}: {}. Will retry on next execution.", 
                    appointment.getId(), e.getMessage());
        } catch (Exception e) {
            log.error("Error saving appointment {}: {}", appointment.getId(), e.getMessage(), e);
            throw e;
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
