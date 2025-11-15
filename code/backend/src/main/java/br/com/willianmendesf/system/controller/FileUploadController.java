package br.com.willianmendesf.system.controller;

import br.com.willianmendesf.system.service.storage.StorageService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.HashMap;
import java.util.Map;

/**
 * Generic file upload controller
 * Supports overwrite strategy with standardized naming
 */
@RestController
@RequestMapping("/files")
@RequiredArgsConstructor
@Slf4j
public class FileUploadController {

    private final StorageService storageService;

    /**
     * POST /api/v1/files/upload
     * Generic file upload endpoint with overwrite strategy
     * 
     * @param file The file to upload
     * @param entityType Type of entity (usuario, membro, logo, agendamento)
     * @param entityId ID of the entity (user ID, member ID, "empresa" for logo, etc.)
     * @param folder Optional folder (defaults to entityType)
     * @return JSON with the file URL
     */
    @PostMapping("/upload")
    public ResponseEntity<Map<String, String>> uploadFile(
            @RequestParam("file") MultipartFile file,
            @RequestParam("entityType") String entityType,
            @RequestParam("entityId") String entityId,
            @RequestParam(value = "folder", required = false) String folder) {
        
        try {
            if (file == null || file.isEmpty()) {
                return ResponseEntity.badRequest()
                    .body(Map.of("error", "File cannot be empty"));
            }

            if (!storageService.isValidImageFile(file)) {
                return ResponseEntity.badRequest()
                    .body(Map.of("error", "Invalid image file. Only JPEG, PNG and GIF are allowed."));
            }

            // Use entityType as folder if not provided
            String targetFolder = folder != null && !folder.isEmpty() ? folder : entityType;
            
            // Upload with overwrite strategy
            String fileUrl = storageService.uploadFile(file, targetFolder, entityType, entityId);
            
            Map<String, String> response = new HashMap<>();
            response.put("url", fileUrl);
            response.put("message", "File uploaded successfully");
            
            log.info("File uploaded: entityType={}, entityId={}, url={}", entityType, entityId, fileUrl);
            
            return ResponseEntity.ok(response);
            
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest()
                .body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            log.error("Error uploading file", e);
            return ResponseEntity.internalServerError()
                .body(Map.of("error", "Failed to upload file: " + e.getMessage()));
        }
    }

    /**
     * DELETE /api/v1/files/delete
     * Delete file by entity type and ID
     */
    @DeleteMapping("/delete")
    public ResponseEntity<Map<String, String>> deleteFile(
            @RequestParam("entityType") String entityType,
            @RequestParam("entityId") String entityId,
            @RequestParam(value = "folder", required = false) String folder) {
        
        try {
            String targetFolder = folder != null && !folder.isEmpty() ? folder : entityType;
            boolean deleted = storageService.deleteFileByEntity(targetFolder, entityType, entityId);
            
            if (deleted) {
                return ResponseEntity.ok(Map.of("message", "File deleted successfully"));
            } else {
                return ResponseEntity.notFound()
                    .build();
            }
        } catch (Exception e) {
            log.error("Error deleting file", e);
            return ResponseEntity.internalServerError()
                .body(Map.of("error", "Failed to delete file: " + e.getMessage()));
        }
    }
}

