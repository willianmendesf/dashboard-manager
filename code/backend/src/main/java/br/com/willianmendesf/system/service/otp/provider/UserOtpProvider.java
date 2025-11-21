package br.com.willianmendesf.system.service.otp.provider;

import br.com.willianmendesf.system.repository.UserRepository;
import br.com.willianmendesf.system.service.otp.OtpUserProvider;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

/**
 * Provider de OTP para usuários do sistema (esqueci senha)
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class UserOtpProvider implements OtpUserProvider {

    private final UserRepository userRepository;

    @Override
    public String getContextKey() {
        return "FORGOT_PASSWORD";
    }

    @Override
    public boolean canReceiveOtp(String phoneNumber) {
        log.debug("Checking if user can receive OTP for phone: {}", phoneNumber);
        // phoneNumber já vem sanitizado do OtpService
        // Usa query customizada para buscar telefone sanitizado
        return userRepository.existsByTelefoneSanitized(phoneNumber);
    }
}

