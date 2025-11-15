package br.com.willianmendesf.system.model.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Data
@NoArgsConstructor
@AllArgsConstructor
@Table(name = "prayer_cycle", indexes = {
    @Index(name = "idx_prayer_cycle_intercessor", columnList = "intercessor_id"),
    @Index(name = "idx_prayer_cycle_date", columnList = "completion_date"),
    @Index(name = "idx_prayer_cycle_type", columnList = "cycle_type")
})
@JsonIgnoreProperties(ignoreUnknown = true)
public class PrayerCycle {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "intercessor_id", nullable = false)
    private PrayerPerson intercessor;

    @Enumerated(EnumType.STRING)
    @Column(name = "cycle_type", nullable = false)
    private CycleType cycleType;

    @Column(name = "completion_date", nullable = false)
    private LocalDateTime completionDate;

    @Column(name = "percent_complete")
    private Double percentComplete;

    @Column(name = "reason", columnDefinition = "TEXT")
    private String reason;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        if (completionDate == null) {
            completionDate = LocalDateTime.now();
        }
    }

    public enum CycleType {
        COMPLETED, ANTICIPATED
    }
}

