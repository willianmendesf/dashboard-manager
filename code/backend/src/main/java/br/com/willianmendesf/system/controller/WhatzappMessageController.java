package br.com.willianmendesf.system.controller;

import br.com.willianmendesf.system.model.WhatsappSender;
import br.com.willianmendesf.system.service.WhatsappMessageService;
import lombok.AllArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/whatsapp")
@AllArgsConstructor
public class WhatzappMessageController {

    private final WhatsappMessageService service;

    @GetMapping("/contacts")
    public ResponseEntity<Object> getContacts() {
        return ResponseEntity.ok(service.getContacts());
    }

    @GetMapping("/groups")
    public ResponseEntity<Object> getGroups() {
        return ResponseEntity.ok(service.getGroups());
    }

    @PostMapping
    public ResponseEntity<Object> send(@RequestBody WhatsappSender message) {
        service.sendMessage(message);
        return ResponseEntity.ok(200);
    }
}
