package br.com.willianmendesf.system.controller;

import br.com.willianmendesf.system.model.dto.BannerChannelDTO;
import br.com.willianmendesf.system.service.BannerChannelService;
import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/banners/channels")
@AllArgsConstructor
@Slf4j
public class BannerChannelController {

    private final BannerChannelService channelService;

    @GetMapping
    @PreAuthorize("hasAuthority('READ_MEMBERS')")
    public ResponseEntity<List<BannerChannelDTO>> getAll() {
        try {
            log.info("Getting all banner channels");
            return ResponseEntity.ok(channelService.getAllChannels());
        } catch (Exception e) {
            log.error("Error getting all banner channels", e);
            return ResponseEntity.internalServerError().build();
        }
    }

    @GetMapping("/active")
    public ResponseEntity<List<BannerChannelDTO>> getActive() {
        try {
            log.info("Getting active banner channels");
            return ResponseEntity.ok(channelService.getActiveChannels());
        } catch (Exception e) {
            log.error("Error getting active banner channels", e);
            return ResponseEntity.internalServerError().build();
        }
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAuthority('READ_MEMBERS')")
    public ResponseEntity<BannerChannelDTO> getById(@PathVariable Long id) {
        try {
            log.info("Getting banner channel by ID: {}", id);
            return ResponseEntity.ok(channelService.getChannelById(id));
        } catch (Exception e) {
            log.error("Error getting banner channel by ID: {}", id, e);
            return ResponseEntity.notFound().build();
        }
    }

    @PostMapping
    @PreAuthorize("hasAuthority('WRITE_MEMBERS')")
    public ResponseEntity<BannerChannelDTO> create(@RequestBody BannerChannelDTO dto) {
        try {
            log.info("Creating banner channel");
            return ResponseEntity.status(HttpStatus.CREATED).body(channelService.createChannel(dto));
        } catch (Exception e) {
            log.error("Error creating banner channel", e);
            return ResponseEntity.badRequest().build();
        }
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority('WRITE_MEMBERS')")
    public ResponseEntity<BannerChannelDTO> update(@PathVariable Long id, @RequestBody BannerChannelDTO dto) {
        try {
            log.info("Updating banner channel with ID: {}", id);
            return ResponseEntity.ok(channelService.updateChannel(id, dto));
        } catch (Exception e) {
            log.error("Error updating banner channel with ID: {}", id, e);
            return ResponseEntity.badRequest().build();
        }
    }

    @PatchMapping("/{id}/toggle-active")
    @PreAuthorize("hasAuthority('WRITE_MEMBERS')")
    public ResponseEntity<BannerChannelDTO> toggleActive(@PathVariable Long id) {
        try {
            log.info("Toggling active status for banner channel with ID: {}", id);
            return ResponseEntity.ok(channelService.toggleChannelActive(id));
        } catch (Exception e) {
            log.error("Error toggling active status for banner channel with ID: {}", id, e);
            return ResponseEntity.badRequest().build();
        }
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAuthority('WRITE_MEMBERS')")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        try {
            log.info("Deleting banner channel with ID: {}", id);
            channelService.deleteChannel(id);
            return ResponseEntity.noContent().build();
        } catch (Exception e) {
            log.error("Error deleting banner channel with ID: {}", id, e);
            return ResponseEntity.badRequest().build();
        }
    }
}

