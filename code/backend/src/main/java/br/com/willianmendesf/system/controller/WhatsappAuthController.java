package br.com.willianmendesf.system.controller;

import br.com.willianmendesf.system.service.WhatsappAuthService;
import lombok.AllArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/whatsapp/auth")
@AllArgsConstructor
public class WhatsappAuthController {

    private final WhatsappAuthService authService;

    /**
     * Inicia login via QR Code
     * GET /whatsapp/auth/login/qrcode
     */
    @GetMapping("/login/qrcode")
    public ResponseEntity<Map<String, Object>> getQRCodeLogin() {
        Map<String, Object> result = authService.initLogin();
        return ResponseEntity.ok(result);
    }

    /**
     * Inicia login via código de pareamento
     * GET /whatsapp/auth/login/with-code?phone={phone}
     */
    @GetMapping("/login/with-code")
    public ResponseEntity<Map<String, Object>> initCodeLogin(@RequestParam String phone) {
        Map<String, Object> result = authService.initLoginWithCode(phone);
        return ResponseEntity.ok(result);
    }

    /**
     * Verifica status do login
     * GET /whatsapp/auth/login/status
     */
    @GetMapping("/login/status")
    public ResponseEntity<Map<String, Object>> getLoginStatus() {
        Map<String, Object> result = authService.getLoginStatus();
        return ResponseEntity.ok(result);
    }

    /**
     * Faz logout da API WhatsApp
     * POST /whatsapp/auth/logout
     */
    @PostMapping("/logout")
    public ResponseEntity<Map<String, Object>> logout() {
        Map<String, Object> result = authService.logout();
        return ResponseEntity.ok(result);
    }
}

