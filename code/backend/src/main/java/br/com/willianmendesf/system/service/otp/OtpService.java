package br.com.willianmendesf.system.service.otp;

import br.com.willianmendesf.system.exception.OtpException;
import br.com.willianmendesf.system.model.WhatsappSender;
import br.com.willianmendesf.system.model.entity.OtpTransaction;
import br.com.willianmendesf.system.model.enums.WhatsappMessageType;
import br.com.willianmendesf.system.repository.OtpTransactionRepository;
import br.com.willianmendesf.system.service.WhatsappMessageService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Random;
import java.util.UUID;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class OtpService {

    private final OtpTransactionRepository otpRepository;
    private final WhatsappMessageService whatsappMessageService;
    private final List<OtpUserProvider> providers;
    private final Random random = new Random();

    private Map<String, OtpUserProvider> providerMap;

    /**
     * Inicializa o mapa de providers após a injeção
     */
    @jakarta.annotation.PostConstruct
    public void init() {
        providerMap = providers.stream()
                .collect(Collectors.toMap(
                        OtpUserProvider::getContextKey,
                        provider -> provider,
                        (existing, replacement) -> {
                            log.warn("Duplicate context key found: {}. Using first provider.", existing.getContextKey());
                            return existing;
                        }
                ));
        log.info("Initialized OTP providers: {}", providerMap.keySet());
    }

    /**
     * Gera e envia um código OTP para o telefone informado
     * 
     * @param rawPhone Telefone no formato original (pode conter caracteres especiais)
     * @param context Contexto do OTP (ex: "MEMBER_PORTAL")
     * @throws OtpException Se o contexto não for encontrado ou o telefone não puder receber OTP
     */
    @Transactional
    public void generateOtp(String rawPhone, String context) {
        log.info("Generating OTP for phone: {} in context: {}", rawPhone, context);

        // Sanitiza o telefone
        String sanitizedPhone = sanitizePhone(rawPhone);
        if (sanitizedPhone == null || sanitizedPhone.length() < 10) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Telefone inválido");
        }

        // Busca o provider correto
        OtpUserProvider provider = providerMap.get(context);
        if (provider == null) {
            log.error("OTP provider not found for context: {}", context);
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Contexto inválido: " + context);
        }

        // Valida se o telefone pode receber OTP
        if (!provider.canReceiveOtp(sanitizedPhone)) {
            log.warn("Phone {} cannot receive OTP in context {}", sanitizedPhone, context);
            // Por segurança, não expor se o telefone existe ou não
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Não foi possível enviar o código. Verifique se o telefone está correto.");
        }

        // Invalida códigos anteriores não usados para o mesmo telefone/contexto
        List<OtpTransaction> previousTransactions = otpRepository.findUnusedTransactions(sanitizedPhone, context);
        if (!previousTransactions.isEmpty()) {
            log.info("Invalidating {} previous OTP transactions for phone: {} in context: {}", 
                    previousTransactions.size(), sanitizedPhone, context);
            previousTransactions.forEach(prev -> prev.setUsed(true));
            otpRepository.saveAll(previousTransactions);
        }

        // Gera código de 6 dígitos
        String code = generateOtpCode();

        // Cria a transação OTP
        OtpTransaction transaction = new OtpTransaction();
        transaction.setPhoneNumber(sanitizedPhone);
        transaction.setCode(code);
        transaction.setContext(context);
        transaction.setExpirationTime(LocalDateTime.now().plusMinutes(30));
        transaction.setUsed(false);
        transaction.setAttempts(0);

        otpRepository.save(transaction);
        log.info("OTP transaction created with ID: {} for phone: {}", transaction.getId(), sanitizedPhone);

        // Envia via WhatsApp
        try {
            // Formata o telefone para WhatsApp (adiciona código do país 55 se necessário)
            String whatsappPhone = formatPhoneForWhatsApp(sanitizedPhone);
            
            WhatsappSender message = new WhatsappSender();
            message.setPhone(whatsappPhone);
            message.setMessageType(WhatsappMessageType.individual);
            message.setMessage(String.format(
                    "Olá!\n\n" +
                    "Seu código de verificação é: *%s*\n\n" +
                    "Este código expira em 30 minutos.\n\n" +
                    "Se você não solicitou este código, ignore esta mensagem.",
                    code
            ));

            whatsappMessageService.sendMessage(message);
            log.info("OTP code sent via WhatsApp to: {} (formatted: {})", sanitizedPhone, whatsappPhone);
        } catch (Exception e) {
            log.error("Error sending OTP via WhatsApp to: {}", sanitizedPhone, e);
            throw new OtpException("Erro ao enviar código via WhatsApp", e);
        }
    }

    /**
     * Valida um código OTP
     * 
     * @param rawPhone Telefone no formato original
     * @param code Código OTP de 6 dígitos
     * @param context Contexto do OTP
     * @return Token temporário (UUID) para próxima etapa
     * @throws OtpException Se o código for inválido, expirado ou exceder tentativas
     */
    @Transactional
    public String validateOtp(String rawPhone, String code, String context) {
        log.info("Validating OTP for phone: {} in context: {}", rawPhone, context);

        // Sanitiza o telefone
        String sanitizedPhone = sanitizePhone(rawPhone);
        if (sanitizedPhone == null || sanitizedPhone.length() < 10) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Telefone inválido");
        }

        // Busca transação válida
        OtpTransaction transaction = otpRepository.findValidTransaction(
                sanitizedPhone,
                context,
                LocalDateTime.now()
        ).orElseThrow(() -> {
            log.warn("No valid OTP transaction found for phone: {} in context: {}", sanitizedPhone, context);
            return new ResponseStatusException(HttpStatus.BAD_REQUEST, "Código inválido ou expirado");
        });

        // Verifica tentativas
        if (transaction.getAttempts() >= 3) {
            log.warn("OTP transaction {} exceeded max attempts", transaction.getId());
            transaction.setUsed(true);
            otpRepository.save(transaction);
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Número máximo de tentativas excedido");
        }

        // Incrementa tentativas
        transaction.setAttempts(transaction.getAttempts() + 1);

        // Valida código
        if (!transaction.getCode().equals(code)) {
            otpRepository.save(transaction);
            log.warn("Invalid OTP code for transaction: {}", transaction.getId());
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Código inválido");
        }

        // Marca como usado
        transaction.setUsed(true);
        otpRepository.save(transaction);
        log.info("OTP validated successfully for phone: {} in context: {}", sanitizedPhone, context);

        // Retorna token temporário (UUID)
        String token = UUID.randomUUID().toString();
        return token;
    }

    /**
     * Sanitiza o telefone removendo caracteres não numéricos
     */
    private String sanitizePhone(String phone) {
        if (phone == null || phone.isBlank()) {
            return null;
        }
        return phone.replaceAll("[^0-9]", "");
    }

    /**
     * Formata o telefone para o formato WhatsApp (com código do país 55)
     * Exemplo: 11999999999 -> 5511999999999
     */
    private String formatPhoneForWhatsApp(String phone) {
        if (phone == null || phone.isBlank()) {
            return phone;
        }
        
        // Se já começa com 55 e tem mais de 12 dígitos, já está formatado
        if (phone.startsWith("55") && phone.length() > 12) {
            return phone;
        }
        
        // Se começa com 55 mas tem menos de 12 dígitos, remove para reformatar
        if (phone.startsWith("55")) {
            phone = phone.substring(2);
        }
        
        // Adiciona código do país 55
        return "55" + phone;
    }

    /**
     * Gera código OTP de 6 dígitos
     */
    private String generateOtpCode() {
        int code = 100000 + random.nextInt(900000);
        return String.format("%06d", code);
    }
}

