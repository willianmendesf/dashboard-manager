package br.com.willianmendesf.system.service.utils;

import lombok.AllArgsConstructor;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;

@Service
@AllArgsConstructor
public class WhatsappSenderService {

    private final String apiNodeUrl;
    private final RestTemplate restTemplate;

    public <T> HttpEntity<T> createRequestEntity(T body) {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        return new HttpEntity<>(body, headers);
    }

    public ResponseEntity<String> sendRequest(String endpoint, HttpEntity<?> requestEntity) {
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

}
