package br.com.willianmendesf.system.controller;

import br.com.willianmendesf.system.model.dto.LoginRequest;
import br.com.willianmendesf.system.model.dto.LoginResponse;
import br.com.willianmendesf.system.model.entity.User;
import br.com.willianmendesf.system.service.CustomUserDetailsService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

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

    @PostMapping("/login")
    public ResponseEntity<LoginResponse> login(@RequestBody LoginRequest request) {
        // Authenticate user (Spring Security gerencia a sessão automaticamente)
        Authentication authentication = authenticationManager.authenticate(
            new UsernamePasswordAuthenticationToken(request.getUsername(), request.getPassword())
        );

        // Set authentication in security context (Spring Security faz isso automaticamente, mas garantimos)
        SecurityContextHolder.getContext().setAuthentication(authentication);

        // Load user details
        UserDetails userDetails = userDetailsService.loadUserByUsername(request.getUsername());
        User user = (User) userDetails;

        // Extract permissions
        List<String> permissions = user.getAuthorities().stream()
            .map(auth -> auth.getAuthority())
            .collect(Collectors.toList());

        // Build response (SEM TOKEN JWT - a sessão é gerenciada pelo Spring Security)
        LoginResponse response = new LoginResponse();
        // response.setToken(null); // Não precisamos mais do token
        response.setId(user.getId());
        response.setUsername(user.getUsername());
        response.setEmail(user.getEmail());
        response.setName(user.getName());
        response.setProfileName(user.getProfile().getName());
        response.setFotoUrl(user.getFotoUrl());
        response.setPermissions(permissions);

        return ResponseEntity.ok(response);
    }

    /**
     * POST /api/v1/auth/solicitar-reset
     * Solicita reset de senha via WhatsApp
     * Recebe CPF e telefone, valida e envia código OTP
     */
    @PostMapping("/solicitar-reset")
    public ResponseEntity<Map<String, String>> solicitarResetSenha(
            @RequestBody br.com.willianmendesf.system.model.dto.SolicitarResetSenhaRequest request) {
        
        try {
            passwordResetService.solicitarResetSenha(request.getCpf(), request.getTelefone());
            
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
     * Redefine a senha usando o código OTP recebido via WhatsApp
     */
    @PostMapping("/redefinir-senha")
    public ResponseEntity<Map<String, String>> redefinirSenha(
            @RequestBody br.com.willianmendesf.system.model.dto.RedefinirSenhaRequest request) {
        
        try {
            passwordResetService.redefinirSenha(
                request.getCpf(), 
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
}

