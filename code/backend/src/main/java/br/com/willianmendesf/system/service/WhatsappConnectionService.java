package br.com.willianmendesf.system.service;

import br.com.willianmendesf.system.service.utils.WhatsappSenderService;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import jakarta.annotation.PostConstruct;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.HashMap;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class WhatsappConnectionService {

    private final WhatsappSenderService whatsappSenderService;
    private final ConfigService configService;
    
    private static final String STATUS_ENDPOINT = "/app/status";
    private static final String RECONNECT_ENDPOINT = "/app/reconnect";
    
    private LocalDateTime lastReconnectAttempt = null;
    private boolean isReconnecting = false;

    @PostConstruct
    public void init() {
        log.info("WhatsappConnectionService inicializado");
        // Verificar se auto-reconnect está habilitado ao iniciar
        if (isAutoReconnectEnabled()) {
            log.info("Reconexão automática habilitada. Intervalo: {} minutos", getReconnectIntervalMinutes());
        } else {
            log.info("Reconexão automática desabilitada");
        }
    }

    /**
     * Verifica o status da conexão WhatsApp
     * @return Map com status (is_connected, is_logged_in, device_id) ou null em caso de erro
     */
    public Map<String, Object> getStatus() {
        try {
            ResponseEntity<String> response = whatsappSenderService.sendGetRequest(STATUS_ENDPOINT);
            
            // Verificar status code da resposta
            if (!response.getStatusCode().is2xxSuccessful()) {
                log.warn("Status code não OK ao verificar status do WhatsApp: {} - Body: {}", 
                    response.getStatusCode(), 
                    response.getBody() != null ? response.getBody().substring(0, Math.min(200, response.getBody().length())) : "null");
                return createErrorStatus("API retornou status code: " + response.getStatusCode());
            }
            
            String jsonResponse = response.getBody();
            
            if (jsonResponse == null || jsonResponse.trim().isEmpty()) {
                log.warn("Resposta vazia ao verificar status do WhatsApp");
                return createErrorStatus("Resposta vazia da API");
            }
            
            // Verificar se a resposta parece ser JSON (não HTML ou outro formato)
            String trimmedResponse = jsonResponse.trim();
            if (!trimmedResponse.startsWith("{") && !trimmedResponse.startsWith("[")) {
                log.error("Resposta da API não é JSON válido. Primeiros caracteres: {}...", 
                    trimmedResponse.substring(0, Math.min(100, trimmedResponse.length())));
                return createErrorStatus("API retornou resposta em formato não-JSON");
            }
            
            return parseStatusResponse(jsonResponse);
        } catch (Exception e) {
            log.error("Erro ao verificar status da conexão WhatsApp: {}", e.getMessage(), e);
            return createErrorStatus(e.getMessage());
        }
    }

    /**
     * Reconecta manualmente à API WhatsApp
     * @return Map com resultado da operação
     */
    public Map<String, Object> reconnect() {
        if (isReconnecting) {
            log.warn("Reconexão já em andamento, ignorando nova tentativa");
            return Map.of(
                "success", false,
                "message", "Reconexão já em andamento"
            );
        }
        
        try {
            isReconnecting = true;
            lastReconnectAttempt = LocalDateTime.now();
            log.info("Iniciando reconexão manual ao WhatsApp...");
            
            ResponseEntity<String> response = whatsappSenderService.sendGetRequest(RECONNECT_ENDPOINT);
            
            // Verificar status code
            if (!response.getStatusCode().is2xxSuccessful()) {
                String bodyPreview = response.getBody() != null ? 
                    response.getBody().substring(0, Math.min(200, response.getBody().length())) : "null";
                log.warn("Reconexão manual retornou status code não OK: {} - Body: {}", 
                    response.getStatusCode(), bodyPreview);
                return Map.of(
                    "success", false,
                    "message", "API retornou status code: " + response.getStatusCode()
                );
            }
            
            String jsonResponse = response.getBody();
            
            // Verificar se a resposta parece ser válida
            if (jsonResponse != null) {
                String trimmed = jsonResponse.trim();
                // Se começar com '<', provavelmente é HTML (erro)
                if (trimmed.startsWith("<")) {
                    log.warn("Reconexão retornou HTML em vez de JSON. Primeiros caracteres: {}...", 
                        trimmed.substring(0, Math.min(200, trimmed.length())));
                    return Map.of(
                        "success", false,
                        "message", "API retornou resposta em formato não-JSON"
                    );
                }
            }
            
            log.info("Reconexão manual realizada com sucesso");
            return Map.of(
                "success", true,
                "message", "Reconexão realizada com sucesso",
                "timestamp", lastReconnectAttempt.format(DateTimeFormatter.ISO_LOCAL_DATE_TIME)
            );
        } catch (Exception e) {
            log.error("Erro ao reconectar ao WhatsApp: {}", e.getMessage(), e);
            return Map.of(
                "success", false,
                "message", "Erro ao reconectar: " + e.getMessage(),
                "timestamp", lastReconnectAttempt != null ? 
                    lastReconnectAttempt.format(DateTimeFormatter.ISO_LOCAL_DATE_TIME) : null
            );
        } finally {
            isReconnecting = false;
        }
    }

    /**
     * Verifica se reconexão automática está habilitada
     */
    public boolean isAutoReconnectEnabled() {
        return configService.getBoolean("WHATSAPP_AUTO_RECONNECT_ENABLED", true);
    }

    /**
     * Obtém o intervalo de reconexão em minutos
     */
    public int getReconnectIntervalMinutes() {
        return configService.getInt("WHATSAPP_AUTO_RECONNECT_INTERVAL_MINUTES", 60);
    }

    private LocalDateTime lastAutoCheck = null;
    
    /**
     * Tarefa agendada para verificar status e reconectar se necessário
     * Executa a cada 1 minuto e verifica internamente o intervalo configurado
     */
    @Scheduled(fixedDelay = 60000) // Verifica a cada 1 minuto
    public void checkAndReconnect() {
        if (!isAutoReconnectEnabled()) {
            return;
        }
        
        // Verificar se já passou o intervalo configurado desde a última verificação
        if (lastAutoCheck != null) {
            int intervalMinutes = getReconnectIntervalMinutes();
            LocalDateTime nextCheck = lastAutoCheck.plusMinutes(intervalMinutes);
            if (LocalDateTime.now().isBefore(nextCheck)) {
                return; // Ainda não passou o intervalo
            }
        }
        
        try {
            lastAutoCheck = LocalDateTime.now();
            log.debug("Verificando status da conexão WhatsApp (reconexão automática)");
            Map<String, Object> status = getStatus();
            
            if (status != null) {
                Boolean isConnected = (Boolean) status.get("is_connected");
                if (isConnected != null && !isConnected) {
                    log.info("Conexão WhatsApp desconectada detectada. Iniciando reconexão automática...");
                    Map<String, Object> reconnectResult = reconnect();
                    if ((Boolean) reconnectResult.get("success")) {
                        log.info("Reconexão automática realizada com sucesso");
                    } else {
                        log.warn("Falha na reconexão automática: {}", reconnectResult.get("message"));
                    }
                } else {
                    log.debug("Conexão WhatsApp está ativa");
                }
            } else {
                log.warn("Não foi possível verificar status - tentando reconectar...");
                reconnect();
            }
        } catch (Exception e) {
            log.error("Erro na verificação automática de reconexão: {}", e.getMessage(), e);
        }
    }

    /**
     * Obtém informações sobre última tentativa de reconexão
     */
    public Map<String, Object> getLastReconnectInfo() {
        Map<String, Object> info = new HashMap<>();
        info.put("lastAttempt", lastReconnectAttempt != null ? 
            lastReconnectAttempt.format(DateTimeFormatter.ISO_LOCAL_DATE_TIME) : null);
        info.put("isReconnecting", isReconnecting);
        return info;
    }

    /**
     * Parse da resposta JSON do endpoint /app/status
     */
    private Map<String, Object> parseStatusResponse(String jsonResponse) {
        try {
            // Validação adicional: garantir que não é HTML
            String trimmed = jsonResponse.trim();
            if (trimmed.startsWith("<")) {
                log.error("Resposta parece ser HTML em vez de JSON. Primeiros caracteres: {}...", 
                    trimmed.substring(0, Math.min(200, trimmed.length())));
                return createErrorStatus("API retornou HTML em vez de JSON (possível erro 404 ou página de erro)");
            }
            
            ObjectMapper mapper = new ObjectMapper();
            JsonNode root = mapper.readTree(jsonResponse);
            JsonNode results = root.path("results");
            
            Map<String, Object> status = new HashMap<>();
            status.put("is_connected", results.path("is_connected").asBoolean(false));
            status.put("is_logged_in", results.path("is_logged_in").asBoolean(false));
            
            if (results.has("device_id")) {
                status.put("device_id", results.path("device_id").asText());
            }
            
            return status;
        } catch (com.fasterxml.jackson.core.JsonParseException e) {
            log.error("Erro ao fazer parse da resposta de status (não é JSON válido). Primeiros caracteres da resposta: {}...", 
                jsonResponse != null ? jsonResponse.substring(0, Math.min(200, jsonResponse.length())) : "null");
            return createErrorStatus("Resposta não é JSON válido: " + e.getMessage());
        } catch (Exception e) {
            log.error("Erro ao fazer parse da resposta de status: {}", e.getMessage(), e);
            return createErrorStatus("Erro ao processar resposta: " + e.getMessage());
        }
    }

    /**
     * Cria status de erro
     */
    private Map<String, Object> createErrorStatus(String errorMessage) {
        Map<String, Object> status = new HashMap<>();
        status.put("is_connected", false);
        status.put("is_logged_in", false);
        status.put("error", errorMessage);
        return status;
    }
}

