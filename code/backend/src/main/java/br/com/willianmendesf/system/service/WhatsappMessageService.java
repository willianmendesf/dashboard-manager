package br.com.willianmendesf.system.service;

import br.com.willianmendesf.system.model.WhatsappMessageSender;
import br.com.willianmendesf.system.model.WhatsappSender;
import br.com.willianmendesf.system.model.enums.WhatsappMediaType;
import br.com.willianmendesf.system.service.utils.WhatsappExtractor;
import br.com.willianmendesf.system.service.utils.WhatsappSenderService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.FileSystemResource;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;

import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import static java.util.Objects.isNull;

@Slf4j
@Service
@RequiredArgsConstructor
public class WhatsappMessageService {

    @Value("${file.images-dir}")
    private String uploadDir;

    private static final String SEND_MESSAGE = "/send/";
    private static final String GET_GROUPS = "/user/my/groups";
    private static final String GET_CONTACTS = "/user/my/contacts";

    private final WhatsappSenderService whatsappSender;

    public List<Map<String, String>> getContacts() {
        HttpEntity<Void> request = whatsappSender.createRequestEntity(null);
        ResponseEntity<String> response = whatsappSender.sendRequest(GET_CONTACTS, request);
        String jsonResponse = response.getBody();
        return WhatsappExtractor.extractContactsList(jsonResponse);
    }


    public Map<String, String> getGroupById(String id) {
        HttpEntity<Void> request = whatsappSender.createRequestEntity(null);
        ResponseEntity<String> response = whatsappSender.sendRequest(GET_GROUPS, request);
        String jsonResponse = response.getBody();

        List<Map<String, String>> groupsList = WhatsappExtractor.extractGroupList(jsonResponse);

        Optional<Map<String, String>> groupFiltered = groupsList.stream()
                .filter(group -> id.equals(group.get("id")))
                .findFirst();

        return groupFiltered.orElse(null);
    }

    public List<Map<String, String>> getGroups() {
        HttpEntity<Void> request = whatsappSender.createRequestEntity(null);
        ResponseEntity<String> response = whatsappSender.sendRequest(GET_GROUPS, request);
        String jsonResponse = response.getBody();
        return WhatsappExtractor.extractGroupList(jsonResponse);
    }

    public List<Map<String, String>> getHistory(String jid) {
        HttpEntity<Void> request = whatsappSender.createRequestEntity(null);
        ResponseEntity<String> response = whatsappSender.sendRequest("/chat/" + jid + "/messages", request);
        String jsonResponse = response.getBody();
        return WhatsappExtractor.extractMessageHistory(jsonResponse);
    }

    public void sendMessage(WhatsappSender message) {
        if (isNull(message.getMedia()) || message.getMedia().isEmpty())
            sendTextMessage(message);
        else
            sendMediaMessage(message);
    }

    private void sendTextMessage(WhatsappSender message) {
        log.info("Sending Text Message!");
        WhatsappMessageSender textMessage = new WhatsappMessageSender(message);
        validateMessage(textMessage);
        HttpEntity<WhatsappMessageSender> request = whatsappSender.createRequestEntity(textMessage);
        whatsappSender.sendRequest(SEND_MESSAGE + "message", request);
        log.info("Message text sent!");
    }

    private void validateMessage(WhatsappMessageSender message) {
        if (message.getPhone() == null || message.getPhone().isBlank())
            throw new IllegalArgumentException("Number is null");
        if (message.getMessage() == null || message.getMessage().isBlank())
            throw new IllegalArgumentException("Message is null");
    }

    private void sendMediaMessage(WhatsappSender message) {
        log.info("Sending media message!");
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.MULTIPART_FORM_DATA);

        var body = createMediaMessage(message);

        HttpEntity<MultiValueMap<String, Object>> request = new HttpEntity<>(body, headers);
        whatsappSender.sendRequest(SEND_MESSAGE + message.getMediaType().getDesc(), request);
        log.info("Message media sent!");
    }

    private MultiValueMap<String, Object> createMediaMessage(WhatsappSender message) {
        MultiValueMap<String, Object> body = new LinkedMultiValueMap<>();

        if(message.getMediaType().equals(WhatsappMediaType.IMAGE)) {
            //body.add("message", message.getMessage());
            body.add("caption", message.getMessage());
        }

        body.add("phone", message.getPhone());
        body.add("view_once", message.getView_once());
        body.add("compress", message.getCompress());
        
        // Usar Path para garantir compatibilidade entre sistemas (Windows/Linux/Docker)
        Path imagePath = Paths.get(uploadDir).resolve(message.getMedia()).normalize().toAbsolutePath();
        
        // Validar se o arquivo existe
        if (!Files.exists(imagePath)) {
            log.error("Image file not found: {}", imagePath);
            throw new IllegalArgumentException("Image file not found: " + imagePath);
        }
        
        log.info("Sending media file from path: {}", imagePath);
        body.add(message.getMediaType().getDesc(), new FileSystemResource(imagePath.toFile()));

        return body;
    }
}

