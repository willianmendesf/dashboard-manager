package br.com.willianmendesf.system.service;

import br.com.willianmendesf.system.service.utils.WhatsappSenderService;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class WhatsappAuthService {

    private final WhatsappSenderService whatsappSenderService;
    
    private static final String LOGIN_ENDPOINT = "/app/login";
    private static final String LOGIN_WITH_CODE_ENDPOINT = "/app/login-with-code";
    private static final String STATUS_ENDPOINT = "/app/status";
    private static final String LOGOUT_ENDPOINT = "/app/logout";

    /**
     * Inicia login via QR Code
     * @return Map com qrLink e qrDuration
     */
    public Map<String, Object> initLogin() {
        try {
            log.info("Iniciando login via QR Code...");
            ResponseEntity<String> response = whatsappSenderService.sendGetRequest(LOGIN_ENDPOINT);
            String jsonResponse = response.getBody();
            
            if (jsonResponse == null) {
                log.warn("Resposta vazia ao iniciar login");
                return createErrorResponse("Resposta vazia da API");
            }
            
            return parseLoginResponse(jsonResponse);
        } catch (Exception e) {
            log.error("Erro ao iniciar login via QR Code: {}", e.getMessage(), e);
            return createErrorResponse("Erro ao iniciar login: " + e.getMessage());
        }
    }

    /**
     * Inicia login via código de pareamento
     * @param phone Número de telefone no formato internacional (ex: 5511999999999)
     * @return Map com pairCode
     */
    public Map<String, Object> initLoginWithCode(String phone) {
        if (phone == null || phone.trim().isEmpty()) {
            return createErrorResponse("Número de telefone é obrigatório");
        }
        
        // Remover caracteres não numéricos (espaços, hífens, parênteses, etc)
        String cleanPhone = phone.replaceAll("[^0-9]", "");
        
        if (cleanPhone.length() < 10) {
            return createErrorResponse("Número de telefone inválido");
        }
        
        try {
            log.info("Iniciando login via código de pareamento para telefone: {}", cleanPhone);
            String endpoint = LOGIN_WITH_CODE_ENDPOINT + "?phone=" + cleanPhone;
            ResponseEntity<String> response = whatsappSenderService.sendGetRequest(endpoint);
            String jsonResponse = response.getBody();
            
            if (jsonResponse == null) {
                log.warn("Resposta vazia ao iniciar login com código");
                return createErrorResponse("Resposta vazia da API");
            }
            
            return parseCodeLoginResponse(jsonResponse);
        } catch (Exception e) {
            log.error("Erro ao iniciar login com código: {}", e.getMessage(), e);
            return createErrorResponse("Erro ao iniciar login: " + e.getMessage());
        }
    }

    /**
     * Verifica status do login
     * @return Map com isLoggedIn e isConnected
     */
    public Map<String, Object> getLoginStatus() {
        try {
            ResponseEntity<String> response = whatsappSenderService.sendGetRequest(STATUS_ENDPOINT);
            String jsonResponse = response.getBody();
            
            if (jsonResponse == null) {
                log.warn("Resposta vazia ao verificar status do login");
                return createErrorResponse("Resposta vazia da API");
            }
            
            return parseStatusResponse(jsonResponse);
        } catch (Exception e) {
            log.error("Erro ao verificar status do login: {}", e.getMessage(), e);
            return createErrorResponse("Erro ao verificar status: " + e.getMessage());
        }
    }

    /**
     * Faz logout da API WhatsApp
     * @return Map com resultado da operação
     */
    public Map<String, Object> logout() {
        try {
            log.info("Fazendo logout do WhatsApp...");
            ResponseEntity<String> response = whatsappSenderService.sendGetRequest(LOGOUT_ENDPOINT);
            
            if (response.getStatusCode().is2xxSuccessful()) {
                log.info("Logout realizado com sucesso");
                return Map.of(
                    "success", true,
                    "message", "Logout realizado com sucesso"
                );
            } else {
                log.warn("Logout retornou status não sucesso: {}", response.getStatusCode());
                return Map.of(
                    "success", false,
                    "message", "Erro ao fazer logout"
                );
            }
        } catch (Exception e) {
            log.error("Erro ao fazer logout: {}", e.getMessage(), e);
            return Map.of(
                "success", false,
                "message", "Erro ao fazer logout: " + e.getMessage()
            );
        }
    }

    /**
     * Parse da resposta JSON do endpoint /app/login
     */
    private Map<String, Object> parseLoginResponse(String jsonResponse) {
        try {
            ObjectMapper mapper = new ObjectMapper();
            JsonNode root = mapper.readTree(jsonResponse);
            JsonNode results = root.path("results");
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("qrLink", results.path("qr_link").asText());
            response.put("qrDuration", results.path("qr_duration").asInt(30));
            
            return response;
        } catch (Exception e) {
            log.error("Erro ao fazer parse da resposta de login: {}", e.getMessage(), e);
            return createErrorResponse("Erro ao processar resposta: " + e.getMessage());
        }
    }

    /**
     * Parse da resposta JSON do endpoint /app/login-with-code
     */
    private Map<String, Object> parseCodeLoginResponse(String jsonResponse) {
        try {
            ObjectMapper mapper = new ObjectMapper();
            JsonNode root = mapper.readTree(jsonResponse);
            JsonNode results = root.path("results");
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("pairCode", results.path("pair_code").asText());
            
            return response;
        } catch (Exception e) {
            log.error("Erro ao fazer parse da resposta de login com código: {}", e.getMessage(), e);
            return createErrorResponse("Erro ao processar resposta: " + e.getMessage());
        }
    }

    /**
     * Parse da resposta JSON do endpoint /app/status
     */
    private Map<String, Object> parseStatusResponse(String jsonResponse) {
        try {
            ObjectMapper mapper = new ObjectMapper();
            JsonNode root = mapper.readTree(jsonResponse);
            JsonNode results = root.path("results");
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("isLoggedIn", results.path("is_logged_in").asBoolean(false));
            response.put("isConnected", results.path("is_connected").asBoolean(false));
            
            if (results.has("device_id")) {
                response.put("deviceId", results.path("device_id").asText());
            }
            
            return response;
        } catch (Exception e) {
            log.error("Erro ao fazer parse da resposta de status: {}", e.getMessage(), e);
            return createErrorResponse("Erro ao processar resposta: " + e.getMessage());
        }
    }

    /**
     * Cria resposta de erro
     */
    private Map<String, Object> createErrorResponse(String errorMessage) {
        Map<String, Object> response = new HashMap<>();
        response.put("success", false);
        response.put("error", errorMessage);
        return response;
    }
}

