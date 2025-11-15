package br.com.willianmendesf.system.service.utils;

import br.com.willianmendesf.system.exception.ApiRequestException;
import lombok.extern.slf4j.Slf4j;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;

@Slf4j
public class ApiRequest {

    public static void post(String endpoint, String requestBody) {
        HttpClient client = HttpClient.newBuilder()
                .version(HttpClient.Version.HTTP_2)
                .connectTimeout(Duration.ofSeconds(10))
                .build();

        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(endpoint))
                .POST(HttpRequest.BodyPublishers.ofString(requestBody != null ? requestBody : ""))
                .header("Content-Type", "application/json")
                .build();

        try {
            HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString());

            if (response.statusCode() >= 200 && response.statusCode() < 300) {
                log.info("Success Status: {}", response.statusCode());
                log.info("Success Response: {}", response.body());
            } else {
                log.error("Error in requisition, Status: {}", response.statusCode());
                log.error("Error body: {}", response.body());
            }

        } catch (Exception e) {
            throw new ApiRequestException("Error in requisition!", e);
        }
    }
}