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
            log.debug("Serving file request: folder={}, filename={}, imagesDirectory={}", folder, filename, imagesDirectory);
            
            // Build paths using the same logic as LocalStorageService
            // LocalStorageService uses: Paths.get(imagesDirectory, folder)
            Path uploadPath = Paths.get(imagesDirectory).normalize().toAbsolutePath();
            Path folderPath = Paths.get(imagesDirectory, folder).normalize().toAbsolutePath();
            Path filePath = folderPath.resolve(filename).normalize();
            
            log.debug("Resolved paths - uploadPath: {}, folderPath: {}, filePath: {}", uploadPath, folderPath, filePath);
            
            // Security check: ensure file is within upload directory
            if (!filePath.startsWith(uploadPath)) {
                log.error("Security violation: Attempted to access file outside upload directory. Requested: {}, Base: {}", filePath, uploadPath);
                return ResponseEntity.notFound().build();
            }
            
            if (!Files.exists(filePath)) {
                log.warn("File not found: {} (resolved from folder: {}, filename: {}, imagesDirectory: {})", 
                    filePath, folder, filename, imagesDirectory);
                // Log directory contents for debugging
                try {
                    if (Files.exists(folderPath) && Files.isDirectory(folderPath)) {
                        log.debug("Directory exists: {}, Contents: {}", folderPath, 
                            java.util.Arrays.toString(folderPath.toFile().list()));
                    } else {
                        log.warn("Directory does not exist: {}", folderPath);
                    }
                } catch (Exception e) {
                    log.debug("Could not list directory contents", e);
                }
                return ResponseEntity.notFound().build();
            }
            
            Resource resource = new UrlResource(filePath.toUri());
            if (!resource.exists() || !resource.isReadable()) {
                log.warn("Resource not readable: {}", filePath);
                return ResponseEntity.notFound().build();
            }
            
            // Determine content type - default to image/jpeg for .jpg files
            String contentType = Files.probeContentType(filePath);
            if (contentType == null) {
                if (filename.toLowerCase().endsWith(".jpg") || filename.toLowerCase().endsWith(".jpeg")) {
                    contentType = "image/jpeg";
                } else if (filename.toLowerCase().endsWith(".png")) {
                    contentType = "image/png";
                } else if (filename.toLowerCase().endsWith(".gif")) {
                    contentType = "image/gif";
                } else {
                    contentType = "application/octet-stream";
                }
            }
            
            return ResponseEntity.ok()
                    .contentType(MediaType.parseMediaType(contentType))
                    .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + filename + "\"")
                    .header(HttpHeaders.CACHE_CONTROL, "public, max-age=31536000") // Cache for 1 year
                    .body(resource);
                    
        } catch (Exception e) {
            log.error("Error serving file: {}/{}", folder, filename, e);
            return ResponseEntity.notFound().build();
        }
    }
}

