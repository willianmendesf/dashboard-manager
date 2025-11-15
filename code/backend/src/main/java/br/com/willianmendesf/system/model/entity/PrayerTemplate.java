package br.com.willianmendesf.system.model.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Entity
@Data
@NoArgsConstructor
@AllArgsConstructor
@Table(name = "prayer_template", indexes = {
    @Index(name = "idx_prayer_template_default", columnList = "is_default"),
    @Index(name = "idx_prayer_template_active", columnList = "active")
})
@JsonIgnoreProperties(ignoreUnknown = true)
public class PrayerTemplate {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "name", nullable = false)
    private String name;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @Column(name = "is_default", nullable = false)
    private Boolean isDefault = false;

    @Column(name = "active", nullable = false)
    private Boolean active = true;

    @Column(name = "header", columnDefinition = "TEXT")
    private String header;

    @Column(name = "list_format", columnDefinition = "TEXT")
    private String listFormat;

    @Column(name = "body", columnDefinition = "TEXT")
    private String body;

    @Column(name = "additional_messages", columnDefinition = "TEXT")
    @Convert(converter = JsonStringListConverter.class)
    private List<String> additionalMessages;

    @Column(name = "variables", columnDefinition = "TEXT")
    @Convert(converter = JsonStringListConverter.class)
    private List<String> variables;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}

