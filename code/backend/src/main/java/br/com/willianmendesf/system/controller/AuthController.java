package br.com.willianmendesf.system.controller;

import br.com.willianmendesf.system.model.dto.LoginRequest;
import br.com.willianmendesf.system.model.dto.LoginResponse;
import br.com.willianmendesf.system.model.entity.User;
import br.com.willianmendesf.system.repository.UserRepository;
import br.com.willianmendesf.system.service.CustomUserDetailsService;
import br.com.willianmendesf.system.service.otp.OtpService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpSession;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.context.HttpSessionSecurityContextRepository;
import org.springframework.security.web.context.SecurityContextRepository;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
@Slf4j
public class AuthController {

    private final AuthenticationManager authenticationManager;
    private final CustomUserDetailsService userDetailsService;
    private final br.com.willianmendesf.system.service.PasswordResetService passwordResetService;
    private final OtpService otpService;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    
    // Repository para persistir o SecurityContext na sessão HTTP
    private final SecurityContextRepository securityContextRepository = new HttpSessionSecurityContextRepository();

    @PostMapping("/login")
    public ResponseEntity<?> login(
            @RequestBody LoginRequest request,
            HttpServletRequest httpRequest) {
        
        log.debug("Login attempt for user: {}", request.getUsername());
        
        try {
            // 1. Autenticar o usuário
            Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getUsername(), request.getPassword())
            );

            log.debug("Authentication successful for user: {}", request.getUsername());

            // 2. Criar ou obter a sessão HTTP (CRÍTICO - garante criação do JSESSIONID)
            HttpSession session = httpRequest.getSession(true); // true = cria sessão se não existir
            
            // 3. Criar SecurityContext e definir a autenticação
            SecurityContext securityContext = SecurityContextHolder.createEmptyContext();
            securityContext.setAuthentication(authentication);
            
            // 4. Persistir o SecurityContext na sessão HTTP
            // Isso garante que o Spring Security reconheça a autenticação em requisições subsequentes
            securityContextRepository.saveContext(securityContext, httpRequest, null);
            
            // 5. Também definir no SecurityContextHolder (para uso imediato)
            SecurityContextHolder.getContext().setAuthentication(authentication);

            log.debug("Session created: {}, JSESSIONID will be set in response", session.getId());

            // 6. Carregar detalhes do usuário
            UserDetails userDetails = userDetailsService.loadUserByUsername(request.getUsername());
            User user = (User) userDetails;

            // 7. Extrair permissões
            List<String> permissions = user.getAuthorities().stream()
                .map(auth -> auth.getAuthority())
                .collect(Collectors.toList());

            // 8. Construir resposta (SEM TOKEN JWT - apenas dados do usuário)
            LoginResponse response = new LoginResponse();
            response.setId(user.getId());
            response.setUsername(user.getUsername());
            response.setEmail(user.getEmail());
            response.setName(user.getName());
            response.setProfileName(user.getProfile().getName());
            response.setFotoUrl(user.getFotoUrl());
            response.setPermissions(permissions);

            log.debug("Login successful for user: {}, session ID: {}", user.getUsername(), session.getId());

            return ResponseEntity.ok(response);
            
        } catch (BadCredentialsException e) {
            log.warn("Login failed for user: {} - Invalid credentials", request.getUsername());
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(Map.of("error", "Usuário ou senha incorretos"));
        } catch (AuthenticationException e) {
            log.warn("Login failed for user: {} - Authentication error: {}", request.getUsername(), e.getMessage());
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(Map.of("error", "Usuário ou senha incorretos"));
        } catch (Exception e) {
            log.error("Unexpected error during login for user: {}", request.getUsername(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("error", "Erro ao fazer login. Tente novamente."));
        }
    }

    /**
     * POST /api/v1/auth/solicitar-reset
     * Solicita reset de senha via WhatsApp
     * Recebe telefone, valida e envia código OTP
     */
    @PostMapping("/solicitar-reset")
    public ResponseEntity<Map<String, String>> solicitarResetSenha(
            @RequestBody br.com.willianmendesf.system.model.dto.SolicitarResetSenhaRequest request) {
        
        try {
            passwordResetService.solicitarResetSenha(request.getTelefone());
            
            // Sempre retornar sucesso genérico (segurança)
            Map<String, String> response = new java.util.HashMap<>();
            response.put("message", "Se os dados estiverem corretos, você receberá um código de verificação via WhatsApp.");
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Error requesting password reset", e);
            // Mesmo em caso de erro, retornar mensagem genérica
            Map<String, String> response = new java.util.HashMap<>();
            response.put("message", "Se os dados estiverem corretos, você receberá um código de verificação via WhatsApp.");
            return ResponseEntity.ok(response);
        }
    }

    /**
     * POST /api/v1/auth/redefinir-senha
     * Redefine a senha usando o código OTP recebido via WhatsApp (método antigo - mantido para compatibilidade)
     */
    @PostMapping("/redefinir-senha")
    public ResponseEntity<Map<String, String>> redefinirSenha(
            @RequestBody br.com.willianmendesf.system.model.dto.RedefinirSenhaRequest request) {
        
        try {
            passwordResetService.redefinirSenha(
                request.getTelefone(), 
                request.getCodigo(), 
                request.getNovaSenha()
            );
            
            Map<String, String> response = new java.util.HashMap<>();
            response.put("message", "Senha redefinida com sucesso!");
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest()
                .body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            log.error("Error resetting password", e);
            return ResponseEntity.status(500)
                .body(Map.of("error", "Erro ao redefinir senha. Tente novamente."));
        }
    }

    /**
     * POST /api/v1/auth/redefinir-senha-otp
     * Redefine a senha usando o sistema OTP genérico
     * Valida o código OTP e define a senha do usuário como o código validado
     */
    @PostMapping("/redefinir-senha-otp")
    @Transactional
    public ResponseEntity<Map<String, String>> redefinirSenhaOtp(
            @RequestBody Map<String, String> request) {
        
        try {
            String telefone = request.get("telefone");
            String codigo = request.get("codigo");
            
            if (telefone == null || telefone.isBlank()) {
                return ResponseEntity.badRequest()
                    .body(Map.of("error", "Telefone é obrigatório"));
            }
            
            if (codigo == null || codigo.isBlank()) {
                return ResponseEntity.badRequest()
                    .body(Map.of("error", "Código é obrigatório"));
            }
            
            log.info("Password reset via OTP requested for phone: {}", telefone);
            
            // Sanitiza e valida telefone
            String sanitizedPhone = br.com.willianmendesf.system.service.utils.PhoneUtil.sanitizeAndValidate(telefone);
            if (sanitizedPhone == null) {
                return ResponseEntity.badRequest()
                    .body(Map.of("error", "Telefone inválido"));
            }
            
            // Valida OTP usando o sistema genérico
            String token = otpService.validateOtp(telefone, codigo, "FORGOT_PASSWORD");
            log.info("OTP validated successfully for phone: {}, token: {}", sanitizedPhone, token);
            
            // Busca usuário por telefone (usando query sanitizada)
            User user = userRepository.findByTelefoneSanitized(sanitizedPhone)
                .orElseThrow(() -> {
                    log.warn("User not found for phone: {}", sanitizedPhone);
                    return new ResponseStatusException(HttpStatus.NOT_FOUND, "Usuário não encontrado");
                });
            
            // Atualiza senha do usuário com o código OTP validado
            user.setPassword(passwordEncoder.encode(codigo));
            userRepository.save(user);
            
            log.info("Password updated for user: {} (phone: {})", user.getUsername(), sanitizedPhone);
            
            Map<String, String> response = new java.util.HashMap<>();
            response.put("message", "Senha redefinida com sucesso! Use o código recebido para fazer login.");
            response.put("username", user.getUsername());
            return ResponseEntity.ok(response);
            
        } catch (ResponseStatusException e) {
            log.error("Error resetting password via OTP: {}", e.getReason());
            return ResponseEntity.status(e.getStatusCode())
                .body(Map.of("error", e.getReason() != null ? e.getReason() : "Erro ao redefinir senha"));
        } catch (Exception e) {
            log.error("Error resetting password via OTP", e);
            return ResponseEntity.status(500)
                .body(Map.of("error", "Erro ao redefinir senha. Tente novamente."));
        }
    }
}

