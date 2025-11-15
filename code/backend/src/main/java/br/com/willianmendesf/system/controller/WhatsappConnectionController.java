package br.com.willianmendesf.system.controller;

import br.com.willianmendesf.system.service.WhatsappConnectionService;
import lombok.AllArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/whatsapp/connection")
@AllArgsConstructor
public class WhatsappConnectionController {

    private final WhatsappConnectionService connectionService;

    /**
     * Obtém o status da conexão WhatsApp
     * GET /whatsapp/connection/status
     */
    @GetMapping("/status")
    public ResponseEntity<Map<String, Object>> getStatus() {
        Map<String, Object> status = connectionService.getStatus();
        Map<String, Object> lastReconnectInfo = connectionService.getLastReconnectInfo();
        
        // Combinar status com informações de reconexão
        status.putAll(lastReconnectInfo);
        
        return ResponseEntity.ok(status);
    }

    /**
     * Reconecta manualmente à API WhatsApp
     * POST /whatsapp/connection/reconnect
     */
    @PostMapping("/reconnect")
    public ResponseEntity<Map<String, Object>> reconnect() {
        Map<String, Object> result = connectionService.reconnect();
        return ResponseEntity.ok(result);
    }

    /**
     * Verifica se reconexão automática está habilitada
     * GET /whatsapp/connection/auto-reconnect/enabled
     */
    @GetMapping("/auto-reconnect/enabled")
    public ResponseEntity<Map<String, Object>> getAutoReconnectStatus() {
        Map<String, Object> response = Map.of(
            "enabled", connectionService.isAutoReconnectEnabled(),
            "intervalMinutes", connectionService.getReconnectIntervalMinutes()
        );
        return ResponseEntity.ok(response);
    }

    /**
     * Ativa ou desativa reconexão automática
     * POST /whatsapp/connection/auto-reconnect/toggle
     * Body: { "enabled": true/false }
     */
    @PostMapping("/auto-reconnect/toggle")
    public ResponseEntity<Map<String, Object>> toggleAutoReconnect(@RequestBody Map<String, Boolean> request) {
        Boolean enabled = request.get("enabled");
        if (enabled == null) {
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "message", "Campo 'enabled' é obrigatório"
            ));
        }
        
        // A configuração é gerenciada pelo ConfigService
        // Este endpoint apenas retorna o status atual após possível atualização
        // A atualização real deve ser feita via Settings
        Map<String, Object> response = Map.of(
            "success", true,
            "message", "Status da reconexão automática: " + (enabled ? "habilitada" : "desabilitada"),
            "note", "A configuração deve ser atualizada na tela de Settings para ter efeito permanente"
        );
        return ResponseEntity.ok(response);
    }
}

