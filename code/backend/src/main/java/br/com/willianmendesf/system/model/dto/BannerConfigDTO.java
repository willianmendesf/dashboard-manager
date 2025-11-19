package br.com.willianmendesf.system.model.dto;

import br.com.willianmendesf.system.model.entity.BannerConfig;
import br.com.willianmendesf.system.model.enums.BannerType;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class BannerConfigDTO {
    private Long id;
    private BannerType type;
    private LocalTime startTime;
    private LocalTime endTime;
    private String title;
    private String youtubeUrl;
    private Boolean isActive;
    private Integer order;
    private Boolean muted;

    public BannerConfigDTO(BannerConfig config) {
        this.id = config.getId();
        this.type = config.getType();
        this.startTime = config.getStartTime();
        this.endTime = config.getEndTime();
        this.title = config.getTitle();
        this.youtubeUrl = config.getYoutubeUrl();
        this.isActive = config.getIsActive();
        this.order = config.getOrder();
        this.muted = config.getMuted();
    }
}

