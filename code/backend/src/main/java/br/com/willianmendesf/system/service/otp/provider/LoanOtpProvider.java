package br.com.willianmendesf.system.service.otp.provider;

import br.com.willianmendesf.system.repository.MemberRepository;
import br.com.willianmendesf.system.service.otp.OtpUserProvider;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

/**
 * Provider de OTP para empréstimo de livros (portal público)
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class LoanOtpProvider implements OtpUserProvider {

    private final MemberRepository memberRepository;

    @Override
    public String getContextKey() {
        return "LOAN_PORTAL";
    }

    @Override
    public boolean canReceiveOtp(String phoneNumber) {
        log.debug("Checking if member can receive OTP for loan portal, phone: {}", phoneNumber);
        return memberRepository.existsByTelefoneOrCelular(phoneNumber);
    }
}

