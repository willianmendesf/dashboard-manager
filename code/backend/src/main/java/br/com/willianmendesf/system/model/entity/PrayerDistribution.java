package br.com.willianmendesf.system.model.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@Entity
@Data
@NoArgsConstructor
@AllArgsConstructor
@Table(name = "prayer_distribution", indexes = {
    @Index(name = "idx_prayer_distribution_date", columnList = "distribution_date"),
    @Index(name = "idx_prayer_distribution_intercessor", columnList = "intercessor_id"),
    @Index(name = "idx_prayer_distribution_status", columnList = "status")
})
@JsonIgnoreProperties(ignoreUnknown = true)
public class PrayerDistribution {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "distribution_date", nullable = false)
    private LocalDate distributionDate;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "intercessor_id", nullable = false)
    private PrayerPerson intercessor;

    @Column(name = "distributed_persons", columnDefinition = "TEXT", nullable = false)
    @Convert(converter = JsonListConverter.class)
    private List<Map<String, Object>> distributedPersons;

    @Column(name = "total_distributed", nullable = false)
    private Integer totalDistributed;

    @Column(name = "sent_at")
    private LocalDateTime sentAt;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    private DistributionStatus status = DistributionStatus.PENDING;

    @Column(name = "template_id")
    private Long templateId;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
        if (distributionDate == null) {
            distributionDate = LocalDate.now();
        }
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    public enum DistributionStatus {
        PENDING, SENT, FAILED
    }
}

