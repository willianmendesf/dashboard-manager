package br.com.willianmendesf.system.model.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "visitors")
@JsonIgnoreProperties(ignoreUnknown = true)
public class VisitorEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "nome_completo", nullable = false)
    private String nomeCompleto;

    @Column(name = "data_visita", nullable = false)
    private LocalDate dataVisita;

    @Column(name = "telefone", length = 20)
    private String telefone;

    @Column(name = "ja_frequenta_igreja", length = 10)
    private String jaFrequentaIgreja; // "Sim" ou "Não"

    @Column(name = "nome_igreja", length = 255)
    private String nomeIgreja; // Nome da igreja quando jaFrequentaIgreja = "Sim"

    @Column(name = "procura_igreja", length = 10)
    private String procuraIgreja; // "Sim" ou "Não"

    @Column(name = "e_de_sp")
    private Boolean eDeSP; // true = SP, false = outro estado

    @Column(name = "estado", length = 2)
    private String estado; // apenas se eDeSP = false

    @Column(name = "foto_url", length = 500)
    private String fotoUrl;

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

