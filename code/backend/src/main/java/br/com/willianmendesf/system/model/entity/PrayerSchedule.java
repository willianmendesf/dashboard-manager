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
@Table(name = "prayer_schedule", indexes = {
    @Index(name = "idx_prayer_schedule_enabled", columnList = "enabled"),
    @Index(name = "idx_prayer_schedule_next_execution", columnList = "proxima_execucao")
})
@JsonIgnoreProperties(ignoreUnknown = true)
public class PrayerSchedule {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "nome", nullable = false)
    private String nome;

    @Column(name = "descricao", columnDefinition = "TEXT")
    private String descricao;

    @Enumerated(EnumType.STRING)
    @Column(name = "frequencia", nullable = false)
    private ScheduleFrequency frequencia;

    @Column(name = "horario", length = 5)
    private String horario;

    @Column(name = "dia_semana")
    private Integer diaSemana;

    @Column(name = "dia_mes")
    private Integer diaMes;

    @Column(name = "enabled", nullable = false)
    private Boolean enabled = false;

    @Column(name = "modo_desenvolvimento", nullable = false)
    private Boolean modoDesenvolvimento = false;

    @Column(name = "ultima_execucao")
    private LocalDateTime ultimaExecucao;

    @Column(name = "proxima_execucao")
    private LocalDateTime proximaExecucao;

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

    public enum ScheduleFrequency {
        DIARIO, SEMANAL, MENSAL, HORARIO
    }
}

