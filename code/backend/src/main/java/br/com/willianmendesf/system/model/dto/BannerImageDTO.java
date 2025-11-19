package br.com.willianmendesf.system.model.dto;

import br.com.willianmendesf.system.model.entity.BannerImage;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class BannerImageDTO {
    private Long id;
    private String title;
    private String imageUrl;
    private Boolean active;
    private Integer displayOrder;
    private Integer transitionDurationSeconds;

    public BannerImageDTO(BannerImage image) {
        this.id = image.getId();
        this.title = image.getTitle();
        this.imageUrl = image.getImageUrl();
        this.active = image.getActive();
        this.displayOrder = image.getDisplayOrder();
        this.transitionDurationSeconds = image.getTransitionDurationSeconds();
    }
}

