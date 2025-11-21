package br.com.willianmendesf.system.service.otp;

import br.com.willianmendesf.system.repository.OtpTransactionRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

/**
 * Serviço de limpeza de transações OTP expiradas
 * Reutiliza o @EnableScheduling já configurado em AppointmentSchedulerConfig
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class OtpCleanupService {

    private final OtpTransactionRepository otpRepository;

    /**
     * Remove transações OTP expiradas
     * Executa diariamente às 2h da manhã
     */
    @Scheduled(cron = "0 0 2 * * *")
    @Transactional
    public void cleanupExpiredTransactions() {
        try {
            LocalDateTime now = LocalDateTime.now();
            log.info("Starting OTP cleanup at {}", now);
            
            int deletedCount = otpRepository.findAll().stream()
                    .filter(otp -> otp.getExpirationTime().isBefore(now))
                    .mapToInt(otp -> {
                        otpRepository.delete(otp);
                        return 1;
                    })
                    .sum();
            
            log.info("OTP cleanup completed. Deleted {} expired transactions", deletedCount);
        } catch (Exception e) {
            log.error("Error during OTP cleanup", e);
        }
    }
}

