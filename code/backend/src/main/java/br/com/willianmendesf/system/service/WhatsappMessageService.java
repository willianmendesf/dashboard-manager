package br.com.willianmendesf.system.service;

import br.com.willianmendesf.system.model.WhatzappMessageSender;
import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;

@Slf4j
@Service
@AllArgsConstructor
public class WhatsappMessageService {

    private final String apiNodeUrl;
    private final RestTemplate restTemplate;

    public void sendMessage(WhatzappMessageSender message) {
        log.info("Sending wtz message!");
        if (message.getPhone() == null || message.getPhone().isBlank()) throw new IllegalArgumentException("Number is null");
        if (message.getMessage() == null || message.getMessage().isBlank()) throw new IllegalArgumentException("Message is null");

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);

        HttpEntity<WhatzappMessageSender> request = new HttpEntity<>(message, headers);

        try {
            ResponseEntity<String> response = restTemplate.postForEntity(apiNodeUrl, request, String.class);
            if (!response.getStatusCode().is2xxSuccessful()) throw new RuntimeException("Fail to send message: " + response.getStatusCode());
        } catch (RestClientException e) {
            throw new RuntimeException("Error: " + e.getMessage(), e);
        }
        log.info("Message wtz sended!");
    }
}

