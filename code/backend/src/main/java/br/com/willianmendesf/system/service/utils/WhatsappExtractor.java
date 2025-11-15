package br.com.willianmendesf.system.service.utils;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

public class WhatsappExtractor {
    public static List<Map<String, String>> extractMessageHistory(String jsonResponse) {
        List<Map<String, String>> contactsList = new ArrayList<>();

        try {
            ObjectMapper mapper = new ObjectMapper();
            JsonNode root = mapper.readTree(jsonResponse);
            JsonNode groups = root.path("results").path("data");

            if (groups.isArray()) {
                for (JsonNode group : groups) {
                    String id = group.path("chat_jid").asText();
                    String timestamp = group.path("timestamp").asText();
                    String message = group.path("content").asText();
                    contactsList.add(Map.of("id", id, "timestamp", timestamp, "message", message));
                }
            }
        } catch (Exception e) {
            throw new RuntimeException("Failed to parse contacts JSON", e);
        }
        return contactsList;
    }

    public static List<Map<String, String>> extractContactsList(String jsonResponse) {
        List<Map<String, String>> contactsList = new ArrayList<>();

        try {
            ObjectMapper mapper = new ObjectMapper();
            JsonNode root = mapper.readTree(jsonResponse);
            JsonNode groups = root.path("results").path("data");

            if (groups.isArray()) {
                for (JsonNode group : groups) {
                    String jid = group.path("jid").asText();
                    String name = group.path("name").asText();
                    contactsList.add(Map.of("id", jid, "name", name));
                }
            }
        } catch (Exception e) {
            throw new RuntimeException("Failed to parse contacts JSON", e);
        }
        return contactsList;
    }

    public static List<Map<String, String>> extractGroupList(String jsonResponse) {
        List<Map<String, String>> groupsList = new ArrayList<>();

        try {
            ObjectMapper mapper = new ObjectMapper();
            JsonNode root = mapper.readTree(jsonResponse);
            JsonNode groups = root.path("results").path("data");

            if (groups.isArray()) {
                for (JsonNode group : groups) {
                    String jid = group.path("JID").asText();
                    String name = group.path("Name").asText();
                    groupsList.add(Map.of("id", jid, "name", name));
                }
            }
        } catch (Exception e) {
            throw new RuntimeException("Failed to parse groups JSON", e);
        }
        return groupsList;
    }
}
