package br.com.willianmendesf.system.configuration;

import br.com.willianmendesf.system.service.AppointmentSchedulerService;
import jakarta.annotation.PostConstruct;
import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.EnableScheduling;
import org.springframework.scheduling.annotation.Scheduled;

@Slf4j
@Configuration
@EnableScheduling
@AllArgsConstructor
public class AppointmentSchedulerConfig {
    private final AppointmentSchedulerService schedulerService;

    @Scheduled(cron = "${scheduler.cron.scheduleTimeLoad}")
    public void scheduleAppointmentLoad() {
        log.info("Loading appointment scheduled");
        schedulerService.loadAppointmentsToCache();
    }

    @Scheduled(fixedRate = 1000)
    public void checkScheduledAppointments() {
        schedulerService.checkAndExecuteScheduledAppointments();
    }

    @PostConstruct
    public void init() {
        log.info("Starting appointment scheduled");
        schedulerService.loadAppointmentsToCache();
    }
}
