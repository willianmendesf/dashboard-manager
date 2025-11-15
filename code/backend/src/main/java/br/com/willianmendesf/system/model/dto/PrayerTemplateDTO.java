package br.com.willianmendesf.system.model.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class PrayerTemplateDTO {
    private Long id;
    private String name;
    private String description;
    private Boolean isDefault;
    private Boolean active;
    private String header;
    private String listFormat;
    private String body;
    private List<String> additionalMessages;
    private List<String> variables;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}

