package br.com.willianmendesf.system.model.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ConfigurationDTO {
    private Long id;
    private String key;
    private String value;
    private String description;
    private String type; // STRING, NUMBER, BOOLEAN, JSON, PASSWORD
    private String category; // APPEARANCE, SYSTEM, NOTIFICATIONS, SECURITY
}

