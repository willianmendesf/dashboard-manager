package br.com.willianmendesf.system.model.entity;

import br.com.willianmendesf.system.model.enums.BannerType;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.HashSet;
import java.util.Set;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "banner_configs")
@JsonIgnoreProperties(ignoreUnknown = true)
public class BannerConfig {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Enumerated(EnumType.STRING)
    @Column(name = "type", nullable = false)
    private BannerType type;

    @Column(name = "start_time", nullable = false)
    private LocalTime startTime;

    @Column(name = "end_time", nullable = false)
    private LocalTime endTime;

    @Column(name = "title", length = 200)
    private String title;

    @Column(name = "youtube_url", length = 500)
    private String youtubeUrl;

    @Column(name = "is_active", nullable = false)
    private Boolean isActive = true;

    @Column(name = "display_order", nullable = false)
    private Integer order = 0;

    @Column(name = "muted", nullable = false)
    private Boolean muted = false; // Default: áudio ativo

    @Column(name = "specific_date")
    private LocalDate specificDate;

    @Column(name = "is_recurring", nullable = false)
    private Boolean isRecurring = true; // Default: recorrente (todos os dias)

    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(
        name = "banner_config_channels",
        joinColumns = @JoinColumn(name = "config_id"),
        inverseJoinColumns = @JoinColumn(name = "channel_id")
    )
    private Set<BannerChannel> channels = new HashSet<>();
}

