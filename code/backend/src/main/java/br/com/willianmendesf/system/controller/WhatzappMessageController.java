package br.com.willianmendesf.system.controller;

import br.com.willianmendesf.system.model.SenderMessage;
import br.com.willianmendesf.system.service.WhatsappMessageService;
import lombok.AllArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/whatsapp")
@AllArgsConstructor
public class WhatzappMessageController {

    private final WhatsappMessageService service;

    @PostMapping
    public ResponseEntity<Object> send(@RequestBody SenderMessage message) {
        service.sendMessage(message);
        return ResponseEntity.ok(200);
    }
}
