package br.com.willianmendesf.system.model.dto;

import br.com.willianmendesf.system.model.entity.BannerChannel;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class BannerChannelDTO {
    private Long id;
    private String name;
    private String description;
    private Boolean isActive;
    private Integer displayOrder;
    private LocalDateTime createdAt;

    public BannerChannelDTO(BannerChannel channel) {
        this.id = channel.getId();
        this.name = channel.getName();
        this.description = channel.getDescription();
        this.isActive = channel.getIsActive();
        this.displayOrder = channel.getDisplayOrder();
        this.createdAt = channel.getCreatedAt();
    }
}

