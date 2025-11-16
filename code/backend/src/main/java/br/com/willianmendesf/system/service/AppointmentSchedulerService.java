package br.com.willianmendesf.system.service;

import br.com.willianmendesf.system.cache.AppointmentCache;
import br.com.willianmendesf.system.exception.WhatsappMessageException;
import br.com.willianmendesf.system.model.WhatsappSender;
import br.com.willianmendesf.system.model.dto.IntercessorDistributionDTO;
import br.com.willianmendesf.system.model.dto.PrayerConfigDTO;
import br.com.willianmendesf.system.model.dto.PrayerDistributionRequest;
import br.com.willianmendesf.system.model.dto.PrayerDistributionResponse;
import br.com.willianmendesf.system.model.dto.PrayerTemplateDTO;
import br.com.willianmendesf.system.model.entity.AppointmentEntity;
import br.com.willianmendesf.system.model.entity.AppointmentExecution;
import br.com.willianmendesf.system.model.entity.PrayerTemplate;
import br.com.willianmendesf.system.model.enums.RecipientType;
import br.com.willianmendesf.system.model.enums.TaskStatus;
import br.com.willianmendesf.system.model.enums.WhatsappMediaType;
import br.com.willianmendesf.system.model.entity.PrayerDistribution;
import br.com.willianmendesf.system.repository.AppointmentExecutionRepository;
import br.com.willianmendesf.system.repository.AppointmentRepository;
import br.com.willianmendesf.system.repository.PrayerDistributionRepository;
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
import java.util.HashMap;
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
    private final PrayerDistributionService prayerDistributionService;
    private final PrayerConfigService prayerConfigService;
    private final PrayerTemplateService prayerTemplateService;
    private final PrayerDistributionRepository prayerDistributionRepository;

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
                case PRAYER360_DISTRIBUTION:
                    executePrayer360Distribution(appointment);
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
                
                // Capturar e salvar mensagem de erro
                String errorMessage = e.getMessage();
                if (errorMessage == null || errorMessage.isEmpty()) {
                    errorMessage = e.getClass().getSimpleName();
                }
                // Limitar tamanho da mensagem de erro para evitar problemas com TEXT
                if (errorMessage.length() > 5000) {
                    errorMessage = errorMessage.substring(0, 5000) + "...";
                }
                execution.setErrorMessage(errorMessage);
                
                executionRepository.save(execution);
            } catch (Exception ex) {
                log.error("Erro ao registrar falha de execução: {}", ex.getMessage(), ex);
            }

            saveAppointmentSafely(appointment);
            appointmentCache.updateCacheAppointment(appointment);
        }
    }

    @Transactional
    public void checkAndExecuteScheduledAppointments() {
        Collection<AppointmentEntity> appointments = appointmentCache.getAllAppointments();
        LocalDateTime now = LocalDateTime.now();

        appointments.stream()
                .filter(appointment -> isAppointmentDueForExecution(appointment, now))
                .forEach(appointment -> {
                    try {
                        executeAppointment(appointment);
                    } catch (Exception e) {
                        log.error("Error executing appointment {} (ID: {}): {}. Continuing with other appointments.", 
                                appointment.getName(), appointment.getId(), e.getMessage(), e);
                    }
                });
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
            // A verificação de duplicidade (existsByAppointmentIdAndScheduledTime) já é suficiente
            // para impedir re-execuções, então não precisamos da trava de 5 segundos
            boolean isDue = !nextExecution.isAfter(now);
            
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
        
        // Calcular o scheduledTime ANTES de executar para garantir consistência
        // Este será o mesmo valor usado tanto em sucesso quanto em erro
        LocalDateTime scheduledTime = null;
        try {
            CronExpression cronExpression = CronExpression.parse(appointment.getSchedule());
            LocalDateTime lastExecTime = !isNull(appointment.getLastExecution()) ?
                    appointment.getLastExecution().toLocalDateTime() :
                    now.minusMinutes(maxBacklogMinutes);

            // Aplicar limite de tempo para execuções antigas
            if (lastExecTime.isBefore(now.minusMinutes(maxBacklogMinutes))) {
                lastExecTime = now.minusMinutes(maxBacklogMinutes);
            }

            scheduledTime = cronExpression.next(lastExecTime);
            
            if (scheduledTime == null) {
                log.warn("No next execution time found for appointment {}", appointment.getId());
                return;
            }
        } catch (Exception e) {
            log.error("Error calculating scheduledTime for appointment {}: {}", appointment.getId(), e.getMessage(), e);
            return;
        }

        // Criar registro de execução ANTES de executar para garantir que seja salvo mesmo em caso de erro
        AppointmentExecution execution = new AppointmentExecution();
        execution.setAppointmentId(appointment.getId());
        execution.setScheduledTime(scheduledTime);
        execution.setExecutionTime(now);
        execution.setStatus(TaskStatus.PENDING); // Status inicial

        try {
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
                case PRAYER360_DISTRIBUTION:
                    executePrayer360Distribution(appointment);
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
            
            log.info("Successfully executed appointment: {} at scheduled time: {}", appointment.getName(), scheduledTime);

        } catch (Exception e) {
            log.error("Error ao executar agendamento {}: {}", appointment.getId(), e.getMessage(), e);

            // Atualizar status em caso de erro
            // Usar o scheduledTime calculado no início para garantir consistência
            appointment.setLastExecution(Timestamp.valueOf(scheduledTime));
            appointment.setLastStatus(TaskStatus.FAILURE);
            execution.setStatus(TaskStatus.FAILURE);
            
            // Capturar e salvar mensagem de erro
            String errorMessage = e.getMessage();
            if (errorMessage == null || errorMessage.isEmpty()) {
                errorMessage = e.getClass().getSimpleName();
            }
            // Limitar tamanho da mensagem de erro para evitar problemas com TEXT
            if (errorMessage.length() > 5000) {
                errorMessage = errorMessage.substring(0, 5000) + "...";
            }
            execution.setErrorMessage(errorMessage);

            // Salvar registro de execução com falha
            try {
                executionRepository.save(execution);
            } catch (Exception ex) {
                log.error("Erro ao registrar falha de execução: {}", ex.getMessage(), ex);
            }

            saveAppointmentSafely(appointment);
            appointmentCache.updateCacheAppointment(appointment);
            
            log.warn("Appointment {} failed but lastExecution updated to {} to prevent re-execution", 
                    appointment.getId(), scheduledTime);
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
            // Logar erro mas não relançar para evitar bloquear outros agendamentos
            log.error("Error saving appointment {}: {}", appointment.getId(), e.getMessage(), e);
        }
    }

    /**
     * Executa o envio de mensagens WhatsApp
     * Valida se há destinatários antes de executar
     */
    private void executeWhatsAppMessage(AppointmentEntity appointment) {
        // Validar se há destinatários antes de executar
        if (!hasValidRecipients(appointment)) {
            log.warn("Appointment {} (ID: {}) does not have valid recipients. " +
                    "RecipientType: {}, sendTo: {}, sendToGroups: {}. Skipping execution.",
                    appointment.getName(), appointment.getId(),
                    appointment.getRecipientType(),
                    appointment.getSendTo(),
                    appointment.getSendToGroups());
            // Lançar exceção para que o agendamento seja marcado como falha e não seja re-executado
            throw new WhatsappMessageException(
                    String.format("No valid recipients found for appointment '%s' (ID: %d). " +
                            "Please configure recipients before enabling this appointment.",
                            appointment.getName(), appointment.getId()));
        }

        if(appointment.getRecipientType() == RecipientType.INDIVIDUAL) {
            log.info("Individual message start send for appointment: {} (ID: {})", 
                    appointment.getName(), appointment.getId());
            sendMessages("individual", appointment, appointment.getSendTo());
            log.info("Send message whatsApp to: {}", appointment.getSendTo());
        } else if(appointment.getRecipientType() == RecipientType.GROUP) {
            log.info("Group message start send for appointment: {} (ID: {})", 
                    appointment.getName(), appointment.getId());
            sendMessages("group", appointment, appointment.getSendToGroups());
            log.info("Send message whatsApp to GroupsList: {}", appointment.getSendToGroups());
        }
    }

    /**
     * Valida se o agendamento tem destinatários válidos configurados
     */
    private boolean hasValidRecipients(AppointmentEntity appointment) {
        if (appointment.getRecipientType() == null) {
            return false;
        }

        if (appointment.getRecipientType() == RecipientType.INDIVIDUAL) {
            return !isNull(appointment.getSendTo()) && !appointment.getSendTo().isEmpty();
        }

        if (appointment.getRecipientType() == RecipientType.GROUP) {
            return !isNull(appointment.getSendToGroups()) && !appointment.getSendToGroups().isEmpty();
        }

        return false;
    }

    /**
     * Executa chamada de API
     */
    private void executeApiCall(AppointmentEntity appointment) {
        try {
            log.info("Starting call request to: {}", appointment.getEndpoint());
            ApiRequest.post(appointment.getEndpoint(), null);
        } catch (Exception e) {
            log.error("Error executing API call for appointment {} (ID: {}): {}", 
                    appointment.getName(), appointment.getId(), e.getMessage(), e);
            throw new RuntimeException("Failed to execute API call for appointment: " + appointment.getName(), e);
        }
    }

    /**
     * Executa o envio de mensagens de monitoramento
     */
    private void executeMonitoringMessage(AppointmentEntity appointment) {
        try {
            if (Boolean.TRUE.equals(appointment.getMonitoring()) && !isNull(appointment.getMonitoringNumbers())) {
                log.info("Monitoring message for numbers start send!");
                sendMessages("monitoring", appointment, appointment.getMonitoringNumbers());
                log.info("Monitoring message for numbers sent!");
            }
        } catch (Exception e) {
            log.error("Error sending monitoring messages to numbers for appointment {} (ID: {}): {}", 
                    appointment.getName(), appointment.getId(), e.getMessage(), e);
            // Não relançar para não interromper a execução principal do agendamento
        }

        try {
            if (Boolean.TRUE.equals(appointment.getMonitoringGroups()) && !isNull(appointment.getMonitoringGroupsIds())) {
                log.info("Monitoring message for groups start send!");
                sendMessages("monitoring", appointment, appointment.getMonitoringGroupsIds());
                log.info("Monitoring message for groups sent!");
            }
        } catch (Exception e) {
            log.error("Error sending monitoring messages to groups for appointment {} (ID: {}): {}", 
                    appointment.getName(), appointment.getId(), e.getMessage(), e);
            // Não relançar para não interromper a execução principal do agendamento
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
            try {
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
            } catch (Exception e) {
                log.error("Error sending message to recipient {} for appointment {} (ID: {}): {}. Continuing with other recipients.", 
                        recipient, appointment.getName(), appointment.getId(), e.getMessage(), e);
                // Continuar com os próximos destinatários mesmo se um falhar
            }
        });
    }

    /**
     * Executa a distribuição de orações do Oração360
     */
    private void executePrayer360Distribution(AppointmentEntity appointment) {
        log.info("Executing Prayer360 distribution for appointment: {}", appointment.getName());
        
        try {
            // 1. Verificar modo desenvolvimento
            boolean modoDesenvolvimento = Boolean.TRUE.equals(appointment.getDevelopment());
            
            // 2. Buscar configuração e forçar modo desenvolvimento se necessário
            PrayerConfigDTO config = prayerConfigService.getConfig();
            config.setModoDesenvolvimento(modoDesenvolvimento);
            
            // 3. Gerar distribuição
            PrayerDistributionRequest request = new PrayerDistributionRequest();
            request.setConfig(config);
            PrayerDistributionResponse response = prayerDistributionService.generateDistribution(request);
            
            log.info("Prayer360 distribution generated: {} intercessors, {} total persons", 
                    response.getDistributions().size(),
                    response.getStatistics() != null ? response.getStatistics().getTotalDistributed() : 0);
            
            // 4. Se NÃO estiver em modo desenvolvimento, enviar mensagens WhatsApp
            if (!modoDesenvolvimento) {
                sendPrayer360Messages(response);
                log.info("Prayer360 messages sent successfully");
            } else {
                log.info("Modo desenvolvimento: Distribuições geradas e salvas, mas mensagens NÃO enviadas");
            }
        } catch (Exception e) {
            log.error("Error executing Prayer360 distribution for appointment {}: {}", 
                    appointment.getId(), e.getMessage(), e);
            throw new RuntimeException("Failed to execute Prayer360 distribution: " + e.getMessage(), e);
        }
    }

    /**
     * Envia mensagens WhatsApp para os intercessores com suas listas de oração
     */
    @Transactional
    private void sendPrayer360Messages(PrayerDistributionResponse response) {
        try {
            LocalDate today = LocalDate.now();
            
            // 1. Buscar template padrão
            PrayerTemplateDTO templateDTO = prayerTemplateService.getDefault();
            PrayerTemplate template = convertTemplateDTOToEntity(templateDTO);
            
            // 2. Para cada intercessor na distribuição:
            for (IntercessorDistributionDTO dist : response.getDistributions()) {
                PrayerDistribution distribution = null;
                try {
                    // Buscar distribuição salva pela data e intercessor
                    List<PrayerDistribution> distributions = prayerDistributionRepository.findByIntercessorAndDateRange(
                            dist.getIntercessor().getId(), today, today);
                    distribution = distributions.stream()
                            .filter(d -> d.getIntercessor().getId().equals(dist.getIntercessor().getId()))
                            .filter(d -> d.getDistributionDate().equals(today))
                            .findFirst()
                            .orElse(null);
                    
                    // 3. Gerar mensagens usando template
                    List<String> messages = prayerTemplateService.generateMessage(
                            template,
                            dist.getIntercessor(),
                            dist.getPrayerList(),
                            new HashMap<>()
                    );
                    
                    // 4. Enviar cada mensagem via WhatsApp
                    boolean allSent = true;
                    for (String message : messages) {
                        if (dist.getIntercessor().getCelular() == null || dist.getIntercessor().getCelular().trim().isEmpty()) {
                            log.warn("Intercessor {} não tem celular configurado, pulando envio", 
                                    dist.getIntercessor().getNome());
                            allSent = false;
                            continue;
                        }
                        
                        try {
                            WhatsappSender sender = new WhatsappSender();
                            sender.setPhone(dist.getIntercessor().getCelular());
                            sender.setMessage(message);
                            whatsapp.sendMessage(sender);
                            
                            log.debug("Message sent to intercessor: {} ({})", 
                                    dist.getIntercessor().getNome(), 
                                    dist.getIntercessor().getCelular());
                        } catch (Exception e) {
                            log.error("Error sending message to intercessor {}: {}", 
                                    dist.getIntercessor().getNome(), e.getMessage());
                            allSent = false;
                            throw e; // Relançar para marcar como FAILED
                        }
                    }
                    
                    // 5. Atualizar status da distribuição
                    if (distribution != null && allSent) {
                        distribution.setStatus(PrayerDistribution.DistributionStatus.SENT);
                        distribution.setSentAt(LocalDateTime.now());
                        prayerDistributionRepository.save(distribution);
                        log.debug("Distribution status updated to SENT for intercessor: {}", 
                                dist.getIntercessor().getNome());
                    }
                } catch (Exception e) {
                    log.error("Error sending messages to intercessor {}: {}. Continuing with other intercessors.", 
                            dist.getIntercessor().getNome(), e.getMessage(), e);
                    
                    // Atualizar status como FAILED se houver distribuição
                    if (distribution != null) {
                        distribution.setStatus(PrayerDistribution.DistributionStatus.FAILED);
                        prayerDistributionRepository.save(distribution);
                        log.debug("Distribution status updated to FAILED for intercessor: {}", 
                                dist.getIntercessor().getNome());
                    }
                    // Continuar com os próximos intercessores mesmo se um falhar
                }
            }
        } catch (Exception e) {
            log.error("Error in sendPrayer360Messages: {}", e.getMessage(), e);
            throw new RuntimeException("Failed to send Prayer360 messages: " + e.getMessage(), e);
        }
    }

    /**
     * Converte PrayerTemplateDTO para PrayerTemplate entity
     */
    private PrayerTemplate convertTemplateDTOToEntity(PrayerTemplateDTO dto) {
        PrayerTemplate template = new PrayerTemplate();
        template.setId(dto.getId());
        template.setName(dto.getName());
        template.setDescription(dto.getDescription());
        template.setIsDefault(dto.getIsDefault());
        template.setActive(dto.getActive());
        template.setHeader(dto.getHeader());
        template.setListFormat(dto.getListFormat());
        template.setBody(dto.getBody());
        template.setAdditionalMessages(dto.getAdditionalMessages());
        template.setVariables(dto.getVariables());
        return template;
    }
}
