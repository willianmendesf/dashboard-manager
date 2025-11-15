package br.com.willianmendesf.system.configuration;

import br.com.willianmendesf.system.service.AppointmentSchedulerService;
import br.com.willianmendesf.system.service.ConfigService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.EnableScheduling;
import org.springframework.scheduling.annotation.Scheduled;

@Slf4j
@Configuration
@EnableScheduling
@RequiredArgsConstructor
public class AppointmentSchedulerConfig {
    private final AppointmentSchedulerService schedulerService;
    private final ConfigService configService;

    // Default value from .env (kept for compatibility)
    // Este campo NÃO é final, então NÃO será incluído no construtor
    // Será injetado via field injection pelo Spring (@Value)
    @Value("${scheduler.cron.scheduleTimeLoad:0 */5 * * * *}")
    private String defaultScheduleTimeLoad;

    @Scheduled(cron = "${scheduler.cron.scheduleTimeLoad:0 */5 * * * *}")
    public void scheduleAppointmentLoad() {
        log.info("Loading appointment scheduled");
        schedulerService.loadAppointmentsToCache();
    }

    @Scheduled(fixedRate = 1000)
    public void checkScheduledAppointments() {
        schedulerService.checkAndExecuteScheduledAppointments();
    }

    @EventListener(ApplicationReadyEvent.class)
    public void init() {
        log.info("Starting appointment scheduled - executing intelligent catch-up");
        schedulerService.loadAppointmentsToCache(true);
        
        // Initialize default configurations if they don't exist
        // This runs after Hibernate has created all tables
        initializeDefaultConfigurations();
    }

    /**
     * Initializes default configurations in database if they don't exist
     */
    private void initializeDefaultConfigurations() {
        try {
            // Recurrence configuration for loading appointments
            String scheduleTimeLoad = configService.get("JOB_RECURRENCE_LOAD_APPOINTMENTS");
            if (scheduleTimeLoad == null) {
                configService.set("JOB_RECURRENCE_LOAD_APPOINTMENTS", defaultScheduleTimeLoad);
                log.info("Default configuration created: JOB_RECURRENCE_LOAD_APPOINTMENTS = {}", defaultScheduleTimeLoad);
            }
            
            // Recurrence configuration for weekly reports (example)
            String weeklyReports = configService.get("JOB_RECURRENCE_WEEKLY_REPORTS");
            if (weeklyReports == null) {
                configService.set("JOB_RECURRENCE_WEEKLY_REPORTS", "0 9 * * 1"); // Monday at 9am
                log.info("Default configuration created: JOB_RECURRENCE_WEEKLY_REPORTS = 0 9 * * 1");
            }
            
            // Recurrence configuration for data synchronization (example)
            String dataSync = configService.get("JOB_RECURRENCE_DATA_SYNC");
            if (dataSync == null) {
                configService.set("JOB_RECURRENCE_DATA_SYNC", "*/30 * * * *"); // Every 30 minutes
                log.info("Default configuration created: JOB_RECURRENCE_DATA_SYNC = */30 * * * *");
            }
        } catch (Exception e) {
            log.warn("Could not initialize default configurations (table may not exist yet): {}", e.getMessage());
            log.info("Default configurations will be created when the table is available. You may need to restart the application.");
        }
    }
}
