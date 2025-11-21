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
import java.util.Optional;

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

        // Verifica se o número está bloqueado ANTES de gerar código
        LocalDateTime now = LocalDateTime.now();
        Optional<OtpTransaction> blockedTransaction = otpRepository.findBlockedTransaction(
                sanitizedPhone, context, now);
        if (blockedTransaction.isPresent()) {
            OtpTransaction blocked = blockedTransaction.get();
            log.warn("Phone {} is blocked until {} in context {}", 
                    sanitizedPhone, blocked.getBlockedUntil(), context);
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, 
                    "Número bloqueado. Tente novamente amanhã.");
        }

        // Gera código de 6 dígitos
        String code = generateOtpCode();

        // Busca qualquer transação existente para o mesmo telefone/contexto (para fazer UPDATE)
        List<OtpTransaction> existingTransactions = otpRepository.findByPhoneNumberAndContext(sanitizedPhone, context);
        OtpTransaction transaction;

        if (!existingTransactions.isEmpty()) {
            // Usa o registro mais recente e faz UPDATE
            transaction = existingTransactions.get(0);
            log.info("Updating existing OTP transaction ID: {} for phone: {} in context: {}", 
                    transaction.getId(), sanitizedPhone, context);
            transaction.setCode(code);
            transaction.setExpirationTime(LocalDateTime.now().plusMinutes(30));
            transaction.setUsed(false);
            transaction.setAttempts(0);
            if (transaction.getBlockedUntil() != null && transaction.getBlockedUntil().isBefore(now)) {
                transaction.setBlockedUntil(null);
            } // Remove bloqueio ao gerar novo código
        } else {
            // Cria nova transação OTP apenas se não existir nenhuma
            transaction = new OtpTransaction();
            transaction.setPhoneNumber(sanitizedPhone);
            transaction.setCode(code);
            transaction.setContext(context);
            transaction.setExpirationTime(LocalDateTime.now().plusMinutes(30));
            transaction.setUsed(false);
            transaction.setAttempts(0);
            transaction.setBlockedUntil(null);
            log.info("Creating new OTP transaction for phone: {} in context: {}", sanitizedPhone, context);
        }

        otpRepository.save(transaction);
        log.info("OTP transaction saved with ID: {} for phone: {}", transaction.getId(), sanitizedPhone);

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
    @Transactional(noRollbackFor = ResponseStatusException.class)
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

        // Verifica se está bloqueado
        LocalDateTime now = LocalDateTime.now();
        if (transaction.getBlockedUntil() != null && transaction.getBlockedUntil().isAfter(now)) {
            log.warn("OTP transaction {} is blocked until {}", transaction.getId(), transaction.getBlockedUntil());
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, 
                    "Número bloqueado. Tente novamente amanhã.");
        }

        // Verifica tentativas antes de validar
        int currentAttempts = transaction.getAttempts();
        if (currentAttempts >= 3) {
            // Bloqueia por 1 dia
            transaction.setBlockedUntil(now.plusDays(1));
            transaction.setUsed(true);
            otpRepository.save(transaction);
            log.warn("OTP transaction {} exceeded max attempts, blocked until {}", 
                    transaction.getId(), transaction.getBlockedUntil());
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, 
                    "Número máximo de tentativas excedido. Tente novamente amanhã.");
        }

        // Incrementa tentativas ANTES de validar
        transaction.setAttempts(currentAttempts + 1);
        int remainingAttempts = 3 - transaction.getAttempts();

        // Valida código
        if (!transaction.getCode().equals(code)) {
            // Se foi a última tentativa, bloqueia
            if (remainingAttempts <= 0) {
                transaction.setBlockedUntil(now.plusDays(1));
                transaction.setUsed(true);
                otpRepository.save(transaction);
                log.warn("Invalid OTP code for transaction: {}, blocked after 3 attempts", transaction.getId());
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, 
                        "Código inválido. Número bloqueado. Tente novamente amanhã.");
            } else {
                otpRepository.save(transaction);
                log.warn("Invalid OTP code for transaction: {}, attempts: {}/3", 
                        transaction.getId(), transaction.getAttempts());
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, 
                        String.format("Código inválido. Tentativas restantes: %d", remainingAttempts));
            }
        }

        // Código válido - reseta tentativas e bloqueio
        transaction.setUsed(true);
        transaction.setAttempts(0);
        transaction.setBlockedUntil(null);
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

