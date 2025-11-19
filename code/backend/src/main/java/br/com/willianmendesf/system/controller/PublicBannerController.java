package br.com.willianmendesf.system.controller;

import br.com.willianmendesf.system.model.dto.BannerCurrentStateDTO;
import br.com.willianmendesf.system.service.BannerService;
import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/public/banners")
@AllArgsConstructor
@Slf4j
public class PublicBannerController {

    private final BannerService bannerService;

    @GetMapping("/current-state")
    public ResponseEntity<BannerCurrentStateDTO> getCurrentState() {
        try {
            log.debug("Public request to get current banner state");
            return ResponseEntity.ok(bannerService.getCurrentState());
        } catch (Exception e) {
            log.error("Error getting current banner state", e);
            return ResponseEntity.internalServerError().build();
        }
    }
}

