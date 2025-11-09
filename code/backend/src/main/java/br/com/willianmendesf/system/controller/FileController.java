package br.com.willianmendesf.system.controller;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;

/**
 * Controller to serve static files (images) from storage
 */
@RestController
@RequestMapping("/files")
@Slf4j
public class FileController {

    @Value("${file.images-dir:/opt/app/images}")
    private String imagesDirectory;

    @GetMapping("/{folder}/{filename:.+}")
    public ResponseEntity<Resource> getFile(
            @PathVariable String folder,
            @PathVariable String filename) {
        try {
            Path filePath = Paths.get(imagesDirectory, folder, filename).normalize();
            Path uploadPath = Paths.get(imagesDirectory).normalize().toAbsolutePath();
            
            // Security check: ensure file is within upload directory
            if (!filePath.startsWith(uploadPath)) {
                log.error("Security violation: Attempted to access file outside upload directory");
                return ResponseEntity.notFound().build();
            }
            
            if (!Files.exists(filePath)) {
                log.warn("File not found: {}", filePath);
                return ResponseEntity.notFound().build();
            }
            
            Resource resource = new UrlResource(filePath.toUri());
            String contentType = Files.probeContentType(filePath);
            if (contentType == null) {
                contentType = "application/octet-stream";
            }
            
            return ResponseEntity.ok()
                    .contentType(MediaType.parseMediaType(contentType))
                    .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + filename + "\"")
                    .body(resource);
                    
        } catch (Exception e) {
            log.error("Error serving file: {}/{}", folder, filename, e);
            return ResponseEntity.notFound().build();
        }
    }
}

