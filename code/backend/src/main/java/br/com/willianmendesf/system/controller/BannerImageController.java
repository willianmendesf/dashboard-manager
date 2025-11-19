package br.com.willianmendesf.system.controller;

import br.com.willianmendesf.system.model.dto.BannerImageDTO;
import br.com.willianmendesf.system.service.BannerService;
import br.com.willianmendesf.system.service.storage.StorageService;
import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/banners/images")
@AllArgsConstructor
@Slf4j
public class BannerImageController {

    private final BannerService bannerService;
    private final StorageService storageService;

    @GetMapping
    @PreAuthorize("hasAuthority('READ_MEMBERS')")
    public ResponseEntity<List<BannerImageDTO>> getAll() {
        try {
            log.info("Getting all banner images");
            return ResponseEntity.ok(bannerService.getAllImages());
        } catch (Exception e) {
            log.error("Error getting all banner images", e);
            return ResponseEntity.internalServerError().build();
        }
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAuthority('READ_MEMBERS')")
    public ResponseEntity<BannerImageDTO> getById(@PathVariable Long id) {
        try {
            log.info("Getting banner image by ID: {}", id);
            return ResponseEntity.ok(bannerService.getImageById(id));
        } catch (Exception e) {
            log.error("Error getting banner image by ID: {}", id, e);
            return ResponseEntity.notFound().build();
        }
    }

    @PostMapping
    @PreAuthorize("hasAuthority('WRITE_MEMBERS')")
    public ResponseEntity<BannerImageDTO> uploadImage(
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "title", required = false) String title,
            @RequestParam(value = "displayOrder", required = false, defaultValue = "0") Integer displayOrder,
            @RequestParam(value = "transitionDurationSeconds", required = false, defaultValue = "10") Integer transitionDurationSeconds) {
        try {
            log.info("Uploading banner image");

            if (file == null || file.isEmpty()) {
                return ResponseEntity.badRequest().build();
            }

            if (!storageService.isValidImageFile(file)) {
                return ResponseEntity.badRequest().build();
            }

            // Upload file to storage
            String imageUrl = storageService.uploadFile(
                file,
                "banners",
                "banner_image",
                java.util.UUID.randomUUID().toString()
            );

            // Create image DTO
            BannerImageDTO dto = new BannerImageDTO();
            dto.setTitle(title);
            dto.setImageUrl(imageUrl);
            dto.setActive(true);
            dto.setDisplayOrder(displayOrder);
            dto.setTransitionDurationSeconds(transitionDurationSeconds);

            BannerImageDTO created = bannerService.createImage(dto);
            return ResponseEntity.status(HttpStatus.CREATED).body(created);
        } catch (Exception e) {
            log.error("Error uploading banner image", e);
            return ResponseEntity.internalServerError().build();
        }
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority('WRITE_MEMBERS')")
    public ResponseEntity<BannerImageDTO> update(@PathVariable Long id, @RequestBody BannerImageDTO dto) {
        try {
            log.info("Updating banner image with ID: {}", id);
            return ResponseEntity.ok(bannerService.updateImage(id, dto));
        } catch (Exception e) {
            log.error("Error updating banner image with ID: {}", id, e);
            return ResponseEntity.badRequest().build();
        }
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAuthority('WRITE_MEMBERS')")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        try {
            log.info("Deleting banner image with ID: {}", id);
            bannerService.deleteImage(id);
            return ResponseEntity.noContent().build();
        } catch (Exception e) {
            log.error("Error deleting banner image with ID: {}", id, e);
            return ResponseEntity.badRequest().build();
        }
    }
}

