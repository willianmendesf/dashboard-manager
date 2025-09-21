package br.com.willianmendesf.system.service;

import br.com.willianmendesf.system.model.WhatsappMessageSender;
import br.com.willianmendesf.system.model.WhatsappSender;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.io.FileSystemResource;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Slf4j
@Service
@AllArgsConstructor
public class WhatsappMessageService {

    private final String SEND_MESSAGE = "/send/";
    private final String GET_GROUPS = "/user/my/groups";
    private final String GET_CONTACTS = "/user/my/contacts";

    private final String apiNodeUrl;
    private final RestTemplate restTemplate;

    private <T> HttpEntity<T> createRequestEntity(T body) {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        return new HttpEntity<>(body, headers);
    }

    private ResponseEntity<String> sendRequest(String endpoint, HttpEntity<?> requestEntity) {
        try {
            ResponseEntity<String> response;

            if (requestEntity.getBody() == null)
                response = restTemplate.getForEntity(apiNodeUrl + endpoint, String.class, requestEntity, String.class);
            else
                response = restTemplate.postForEntity(apiNodeUrl + endpoint, requestEntity, String.class);

            if (!response.getStatusCode().is2xxSuccessful())
                throw new RuntimeException("Fail to send message: " + response.getStatusCode());

            return response;
        } catch (RestClientException e) {
            throw new RuntimeException("Error: " + e.getMessage(), e);
        }
    }

    private void validateMessage(WhatsappMessageSender message) {
        if (message.getPhone() == null || message.getPhone().isBlank())
            throw new IllegalArgumentException("Number is null");
        if (message.getMessage() == null || message.getMessage().isBlank())
            throw new IllegalArgumentException("Message is null");
    }

    public List<Map<String, String>> getContacts() {
        HttpEntity<Void> request = createRequestEntity(null);
        ResponseEntity<String> response = sendRequest(GET_CONTACTS, request);
        String jsonResponse = response.getBody();
        return extractGroupList(jsonResponse);
    }

    public List<Map<String, String>> getGroups() {
        HttpEntity<Void> request = createRequestEntity(null);
        ResponseEntity<String> response = sendRequest(GET_GROUPS, request);
        String jsonResponse = response.getBody();
        return extractGroupList(jsonResponse);
    }

    public void sendMessage(WhatsappSender message) {
        if(message.getMedia().isEmpty()) sendTextMessage(message);
        else sendMediaMessage(message);
    }

    public void sendTextMessage(WhatsappSender message) {
        log.info("Sending Text Message!");
        WhatsappMessageSender textMessage = new WhatsappMessageSender(message);
        validateMessage(textMessage);
        HttpEntity<WhatsappMessageSender> request = createRequestEntity(textMessage);
        sendRequest(SEND_MESSAGE + "message", request);
        log.info("Message text sent!");
    }

    public void sendMediaMessage(WhatsappSender message) {
        log.info("Sending media message!");
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.MULTIPART_FORM_DATA);

        var body = createMidiaMessage(message);

        HttpEntity<MultiValueMap<String, Object>> request = new HttpEntity<>(body, headers);
        sendRequest(SEND_MESSAGE + message.getMediaType().getDesc(), request);
        log.info("Message media sent!");
    }

    private MultiValueMap<String, Object> createMidiaMessage(WhatsappSender message) {
        MultiValueMap<String, Object> body = new LinkedMultiValueMap<>();

        body.add("phone", message.getPhone());
        body.add("message", message.getMessage());
        body.add("caption", message.getCaption());
        body.add("view_once", message.getView_once());
        body.add("compress", message.getCompress());
        body.add(message.getMediaType().getDesc(), new FileSystemResource(message.getMedia()));

        return body;
    }


    public List<Map<String, String>> extractGroupList(String jsonResponse) {
        List<Map<String, String>> groupsList = new ArrayList<>();

        try {
            ObjectMapper mapper = new ObjectMapper();
            JsonNode root = mapper.readTree(jsonResponse);
            JsonNode groups = root.path("results").path("data");

            if (groups.isArray()) {
                for (JsonNode group : groups) {
                    String jid = group.path("JID").asText();
                    String name = group.path("Name").asText();
                    groupsList.add(Map.of("JID", jid, "Name", name));
                }
            }
        } catch (Exception e) {
            throw new RuntimeException("Failed to parse groups JSON", e);
        }
        return groupsList;
    }
}

