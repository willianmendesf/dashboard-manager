package br.com.willianmendesf.system.controller;

import br.com.willianmendesf.system.model.dto.OtpRequestDTO;
import br.com.willianmendesf.system.model.dto.OtpValidateDTO;
import br.com.willianmendesf.system.model.dto.OtpValidateResponseDTO;
import br.com.willianmendesf.system.service.otp.OtpService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/auth/otp")
@RequiredArgsConstructor
public class OtpController {

    private final OtpService otpService;

    /**
     * Solicita o envio de um código OTP
     * POST /api/v1/auth/otp/request
     */
    @PostMapping("/request")
    public ResponseEntity<Map<String, String>> requestOtp(@RequestBody OtpRequestDTO request) {
        try {
            log.info("OTP request received for phone: {} in context: {}", request.getPhone(), request.getContext());
            
            if (request.getPhone() == null || request.getPhone().isBlank()) {
                return ResponseEntity.badRequest()
                        .body(java.util.Map.of("message", "Telefone é obrigatório"));
            }
            
            if (request.getContext() == null || request.getContext().isBlank()) {
                return ResponseEntity.badRequest()
                        .body(java.util.Map.of("message", "Contexto é obrigatório"));
            }

            otpService.generateOtp(request.getPhone(), request.getContext());
            
            return ResponseEntity.ok(java.util.Map.of("message", "Código enviado com sucesso"));
        } catch (ResponseStatusException e) {
            // ResponseStatusException já tem status e mensagem configurados
            log.error("Error requesting OTP: {}", e.getReason());
            HttpStatus status = HttpStatus.valueOf(e.getStatusCode().value());
            return ResponseEntity.status(status)
                    .body(java.util.Map.of("message", e.getReason() != null ? e.getReason() : "Erro ao enviar código. Tente novamente."));
        } catch (Exception e) {
            log.error("Error requesting OTP", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(java.util.Map.of("message", e.getMessage() != null ? e.getMessage() : "Erro ao enviar código. Tente novamente."));
        }
    }

    /**
     * Valida um código OTP
     * POST /api/v1/auth/otp/validate
     */
    @PostMapping("/validate")
    public ResponseEntity<?> validateOtp(@RequestBody OtpValidateDTO request) {
        try {
            log.info("OTP validation received for phone: {} in context: {}", request.getPhone(), request.getContext());
            
            if (request.getPhone() == null || request.getPhone().isBlank()) {
                return ResponseEntity.badRequest()
                        .body(Map.of("message", "Telefone é obrigatório"));
            }
            
            if (request.getCode() == null || request.getCode().isBlank()) {
                return ResponseEntity.badRequest()
                        .body(Map.of("message", "Código é obrigatório"));
            }
            
            if (request.getContext() == null || request.getContext().isBlank()) {
                return ResponseEntity.badRequest()
                        .body(Map.of("message", "Contexto é obrigatório"));
            }

            String token = otpService.validateOtp(request.getPhone(), request.getCode(), request.getContext());
            
            OtpValidateResponseDTO response = new OtpValidateResponseDTO();
            response.setToken(token);
            response.setPhone(request.getPhone());
            response.setMessage("Código validado com sucesso");
            
            return ResponseEntity.ok(response);
        } catch (ResponseStatusException e) {
            // ResponseStatusException já tem status e mensagem configurados
            log.error("Error validating OTP: {}", e.getReason());
            HttpStatus status = HttpStatus.valueOf(e.getStatusCode().value());
            return ResponseEntity.status(status)
                    .body(Map.of("message", e.getReason() != null ? e.getReason() : "Erro ao validar código. Tente novamente."));
        } catch (Exception e) {
            log.error("Error validating OTP", e);
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("message", e.getMessage() != null ? e.getMessage() : "Erro ao validar código. Tente novamente."));
        }
    }
}

