package br.com.willianmendesf.system.service.otp.provider;

import br.com.willianmendesf.system.repository.MemberRepository;
import br.com.willianmendesf.system.service.otp.OtpUserProvider;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

/**
 * Provider de OTP para membros do portal público
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class MemberOtpProvider implements OtpUserProvider {

    private final MemberRepository memberRepository;

    @Override
    public String getContextKey() {
        return "MEMBER_PORTAL";
    }

    @Override
    public boolean canReceiveOtp(String phoneNumber) {
        log.debug("Checking if member can receive OTP for phone: {}", phoneNumber);
        return memberRepository.existsByTelefoneOrCelular(phoneNumber);
    }
}

