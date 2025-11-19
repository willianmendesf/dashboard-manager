package br.com.willianmendesf.system.model.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class BannerCurrentStateDTO {
    private String mode; // "SLIDE" or "VIDEO"
    private String videoUrl;
    private Boolean muted;
    private List<BannerImageDTO> images;
}

