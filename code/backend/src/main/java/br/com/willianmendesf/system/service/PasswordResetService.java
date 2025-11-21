package br.com.willianmendesf.system.service;

import br.com.willianmendesf.system.model.entity.MemberEntity;
import br.com.willianmendesf.system.model.entity.User;
import br.com.willianmendesf.system.model.WhatsappSender;
import br.com.willianmendesf.system.model.enums.WhatsappMessageType;
import br.com.willianmendesf.system.repository.MemberRepository;
import br.com.willianmendesf.system.repository.UserRepository;
import br.com.willianmendesf.system.service.utils.PhoneUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Random;

@Service
@Slf4j
@RequiredArgsConstructor
public class PasswordResetService {

    private final MemberRepository memberRepository;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final WhatsappMessageService whatsappService;
    private final Random random = new Random();

    /**
     * Solicita reset de senha via WhatsApp
     * Valida telefone, gera OTP e envia via WhatsApp
     */
    @Transactional
    public void solicitarResetSenha(String telefone) {
        // Sanitizar e validar telefone
        String telefoneNormalizado = PhoneUtil.sanitizeAndValidate(telefone);
        if (telefoneNormalizado == null) {
            log.warn("Password reset requested with invalid phone: {}", telefone);
            return; // Retorna silenciosamente para não expor informações
        }
        
        // Buscar membro pelo telefone
        MemberEntity member = memberRepository.findByTelefoneOrCelular(telefoneNormalizado);
        
        // Security: Sempre retornar sucesso mesmo se não encontrar (evita enumeração)
        if (member == null) {
            log.warn("Password reset requested for non-existent phone: {}", telefoneNormalizado);
            return; // Retorna silenciosamente para não expor informações
        }

        // Buscar usuário pelo email do membro
        User user = userRepository.findByEmail(member.getEmail())
            .orElse(null);

        if (user == null) {
            log.warn("Password reset requested for member without user account: {}", telefoneNormalizado);
            return; // Retorna silenciosamente
        }

        // Gerar código OTP de 6 dígitos
        String otp = gerarOTP();
        String otpHash = passwordEncoder.encode(otp);

        // Salvar código e expiração (5 minutos)
        user.setCodigoResetSenha(otpHash);
        user.setCodigoResetExpiracao(LocalDateTime.now().plusMinutes(5));
        userRepository.save(user);

        // Enviar código via WhatsApp
        String numeroWhatsApp = member.getCelular() != null ? member.getCelular() : member.getTelefone();
        enviarCodigoWhatsApp(numeroWhatsApp, otp, member.getNome());

        log.info("Password reset code sent to user: {} (phone: {})", user.getUsername(), telefoneNormalizado);
    }

    /**
     * Redefine a senha usando o código OTP
     */
    @Transactional
    public void redefinirSenha(String telefone, String codigo, String novaSenha) {
        // Sanitizar e validar telefone
        String telefoneNormalizado = PhoneUtil.sanitizeAndValidate(telefone);
        if (telefoneNormalizado == null) {
            throw new IllegalArgumentException("Telefone inválido");
        }
        
        // Buscar membro pelo telefone
        MemberEntity member = memberRepository.findByTelefoneOrCelular(telefoneNormalizado);
        if (member == null) {
            throw new IllegalArgumentException("Telefone não encontrado");
        }

        // Buscar usuário pelo email do membro
        User user = userRepository.findByEmail(member.getEmail())
            .orElseThrow(() -> new IllegalArgumentException("Usuário não encontrado para este telefone"));

        // Validar expiração
        if (user.getCodigoResetExpiracao() == null || 
            user.getCodigoResetExpiracao().isBefore(LocalDateTime.now())) {
            throw new IllegalArgumentException("Código expirado. Solicite um novo código.");
        }

        // Validar código
        if (user.getCodigoResetSenha() == null || 
            !passwordEncoder.matches(codigo, user.getCodigoResetSenha())) {
            throw new IllegalArgumentException("Código inválido");
        }

        // Validar nova senha
        if (novaSenha == null || novaSenha.length() < 6) {
            throw new IllegalArgumentException("A senha deve ter pelo menos 6 caracteres");
        }

        // Atualizar senha
        user.setPassword(passwordEncoder.encode(novaSenha));
        user.setCodigoResetSenha(null);
        user.setCodigoResetExpiracao(null);
        userRepository.save(user);

        log.info("Password reset successfully for user: {} (phone: {})", user.getUsername(), telefoneNormalizado);
    }

    /**
     * Gera um código OTP de 6 dígitos
     */
    private String gerarOTP() {
        int code = 100000 + random.nextInt(900000); // 100000 a 999999
        return String.valueOf(code);
    }


    /**
     * Envia código OTP via WhatsApp
     */
    private void enviarCodigoWhatsApp(String numero, String codigo, String nome) {
        try {
            WhatsappSender message = new WhatsappSender();
            message.setPhone(numero);
            message.setMessageType(WhatsappMessageType.individual);
            message.setMessage(String.format(
                "Olá %s!\n\n" +
                "Seu código de redefinição de senha é: *%s*\n\n" +
                "Este código expira em 5 minutos.\n\n" +
                "Se você não solicitou esta redefinição, ignore esta mensagem.",
                nome != null ? nome : "Usuário",
                codigo
            ));
            
            whatsappService.sendMessage(message);
            log.info("OTP code sent via WhatsApp to: {}", numero);
        } catch (Exception e) {
            log.error("Error sending OTP via WhatsApp to: {}", numero, e);
            throw new RuntimeException("Erro ao enviar código via WhatsApp: " + e.getMessage(), e);
        }
    }
}

