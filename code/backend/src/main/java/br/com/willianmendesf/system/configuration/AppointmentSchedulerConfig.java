package br.com.willianmendesf.system.configuration;

import br.com.willianmendesf.system.service.AppointmentSchedulerService;
import jakarta.annotation.PostConstruct;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.EnableScheduling;
import org.springframework.scheduling.annotation.Scheduled;

@Configuration
@EnableScheduling
@Slf4j
public class AppointmentSchedulerConfig {
    private final AppointmentSchedulerService schedulerService;

    @Autowired
    public AppointmentSchedulerConfig(AppointmentSchedulerService schedulerService) {
        this.schedulerService = schedulerService;
    }

    /**
     * Carrega os agendamentos para o cache uma vez por dia (à meia-noite)
     */
    @Scheduled(cron = "*/10 * * * * ?")
    public void dailyAppointmentLoading() {
        log.info("Iniciando carregamento diário de agendamentos");
        schedulerService.loadAppointmentsToCache();
    }

    /**
     * Verifica agendamentos a cada segundo
     */
    @Scheduled(fixedRate = 1000)
    public void checkScheduledAppointments() {
        schedulerService.checkAndExecuteScheduledAppointments();
    }

    /**
     * Carrega os agendamentos na inicialização da aplicação
     */
    @PostConstruct
    public void init() {
        log.info("Inicializando o sistema de agendamento");
        schedulerService.loadAppointmentsToCache();
    }
}
