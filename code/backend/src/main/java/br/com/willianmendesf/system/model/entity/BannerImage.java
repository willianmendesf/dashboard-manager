package br.com.willianmendesf.system.model.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.HashSet;
import java.util.Set;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "banner_images")
@JsonIgnoreProperties(ignoreUnknown = true)
public class BannerImage {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "title", length = 200)
    private String title;

    @Column(name = "image_url", length = 500, nullable = false)
    private String imageUrl;

    @Column(name = "active", nullable = false)
    private Boolean active = true;

    @Column(name = "display_order", nullable = false)
    private Integer displayOrder = 0;

    @Column(name = "transition_duration_seconds")
    private Integer transitionDurationSeconds = 10; // Default 10 segundos

    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(
        name = "banner_image_channels",
        joinColumns = @JoinColumn(name = "image_id"),
        inverseJoinColumns = @JoinColumn(name = "channel_id")
    )
    private Set<BannerChannel> channels = new HashSet<>();
}

