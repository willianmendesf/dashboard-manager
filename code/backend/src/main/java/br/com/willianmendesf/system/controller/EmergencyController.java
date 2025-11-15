package br.com.willianmendesf.system.controller;

import br.com.willianmendesf.system.model.entity.User;
import br.com.willianmendesf.system.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

/**
 * Emergency controller for system recovery
 * WARNING: This should be disabled in production or protected by additional security
 */
@RestController
@RequestMapping("/emergency")
@RequiredArgsConstructor
@Slf4j
public class EmergencyController {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    /**
     * POST /api/v1/emergency/reset-root-password
     * Emergency endpoint to reset root user password
     * SECURITY: This should only be accessible in development or with additional authentication
     * 
     * Body: { "secret": "YOUR_SECRET_KEY", "newPassword": "newpassword123" }
     * 
     * Set EMERGENCY_SECRET in environment variable for security
     */
    @PostMapping("/reset-root-password")
    public ResponseEntity<Map<String, String>> resetRootPassword(@RequestBody Map<String, String> request) {
        String secret = request.get("secret");
        String newPassword = request.get("newPassword");

        // Check secret (set EMERGENCY_SECRET in environment)
        String expectedSecret = System.getenv("EMERGENCY_SECRET");
        if (expectedSecret == null || expectedSecret.isEmpty()) {
            expectedSecret = "EMERGENCY_RESET_2024"; // Default for development only
            log.warn("EMERGENCY_SECRET not set. Using default (INSECURE - change in production!)");
        }

        if (secret == null || !secret.equals(expectedSecret)) {
            log.warn("Invalid emergency secret attempted");
            return ResponseEntity.status(401).body(Map.of("error", "Unauthorized"));
        }

        if (newPassword == null || newPassword.length() < 6) {
            return ResponseEntity.badRequest().body(Map.of("error", "Password must be at least 6 characters"));
        }

        try {
            User rootUser = userRepository.findByUsername("root")
                .orElseThrow(() -> new RuntimeException("Root user not found"));

            rootUser.setPassword(passwordEncoder.encode(newPassword));
            userRepository.save(rootUser);

            log.warn("ROOT password was reset via emergency endpoint");
            
            Map<String, String> response = new HashMap<>();
            response.put("message", "Root password reset successfully");
            response.put("username", "root");
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Error resetting root password", e);
            return ResponseEntity.status(500).body(Map.of("error", "Internal server error"));
        }
    }
}

