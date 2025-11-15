package br.com.willianmendesf.system.model.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@Entity
@Data
@NoArgsConstructor
@AllArgsConstructor
@Table(name = "prayer_person", indexes = {
    @Index(name = "idx_prayer_person_nome", columnList = "nome"),
    @Index(name = "idx_prayer_person_celular", columnList = "celular"),
    @Index(name = "idx_prayer_person_member_id", columnList = "member_id"),
    @Index(name = "idx_prayer_person_intercessor", columnList = "is_intercessor"),
    @Index(name = "idx_prayer_person_active", columnList = "active")
})
@JsonIgnoreProperties(ignoreUnknown = true)
public class PrayerPerson {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "nome", nullable = false)
    private String nome;

    @Column(name = "celular")
    private String celular;

    @Enumerated(EnumType.STRING)
    @Column(name = "tipo", nullable = false)
    private PersonType tipo;

    @Column(name = "is_intercessor", nullable = false)
    private Boolean isIntercessor = false;

    @Column(name = "is_external", nullable = false)
    private Boolean isExternal = false;

    @Column(name = "member_id")
    private Long memberId;

    @Column(name = "nome_pai")
    private String nomePai;

    @Column(name = "telefone_pai")
    private String telefonePai;

    @Column(name = "nome_mae")
    private String nomeMae;

    @Column(name = "telefone_mae")
    private String telefoneMae;

    @Column(name = "responsaveis", columnDefinition = "TEXT")
    @Convert(converter = JsonMapConverter.class)
    private List<Map<String, String>> responsaveis;

    @Column(name = "active", nullable = false)
    private Boolean active = true;

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

    public enum PersonType {
        CRIANCA, ADULTO
    }
}

