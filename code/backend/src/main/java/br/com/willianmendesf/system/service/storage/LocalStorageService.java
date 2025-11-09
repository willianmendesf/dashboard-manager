package br.com.willianmendesf.system.service.storage;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.Arrays;
import java.util.List;

/**
 * Local file system storage implementation
 * For development/testing purposes only
 * In production, use S3StorageService or similar
 */
@Service
@Slf4j
public class LocalStorageService implements StorageService {

    @Value("${file.images-dir:/opt/app/images}")
    private String imagesDirectory;

    @Value("${app.base-url:http://localhost:8080}")
    private String baseUrl;

    @Override
    public String uploadFile(MultipartFile file, String folder, String entityType, String entityId) {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("File cannot be null or empty");
        }

        if (!isValidImageFile(file)) {
            throw new IllegalArgumentException("Invalid image file. Only JPEG, PNG and GIF are allowed.");
        }

        try {
            // Create directory if it doesn't exist
            Path uploadDir = Paths.get(imagesDirectory, folder);
            Files.createDirectories(uploadDir);

            // Generate standardized filename based on entity type and ID
            String extension = getFileExtension(file.getOriginalFilename());
            String filename = generateStandardizedFilename(entityType, entityId, extension);
            Path filePath = uploadDir.resolve(filename);

            // Delete old file if exists (overwrite strategy)
            if (Files.exists(filePath)) {
                Files.delete(filePath);
                log.info("Deleted old file for overwrite: {}", filename);
            }

            // Save new file
            Files.copy(file.getInputStream(), filePath, StandardCopyOption.REPLACE_EXISTING);

            // Return public URL
            String publicUrl = String.format("%s/api/v1/files/%s/%s", baseUrl, folder, filename);
            log.info("File uploaded successfully with overwrite strategy: {}", publicUrl);
            return publicUrl;

        } catch (IOException e) {
            log.error("Error uploading file", e);
            throw new RuntimeException("Failed to upload file: " + e.getMessage(), e);
        }
    }

    /**
     * Generates a standardized filename based on entity type and ID
     * Examples:
     * - Logo: logo_empresa.png
     * - User photo: usuario_id_123.png
     * - Member photo: membro_id_456.png
     * - Appointment image: agendamento_id_789.png
     */
    private String generateStandardizedFilename(String entityType, String entityId, String extension) {
        // Normalize entity type
        String normalizedType = entityType.toLowerCase().trim();
        
        // Special case for logo (always uses "empresa" as ID)
        if ("logo".equals(normalizedType) || "logos".equals(normalizedType)) {
            return String.format("logo_empresa%s", extension);
        }
        
        // For other entities, use pattern: {entityType}_id_{entityId}.{ext}
        return String.format("%s_id_%s%s", normalizedType, entityId, extension);
    }

    /**
     * Extracts file extension from filename
     */
    private String getFileExtension(String filename) {
        if (filename == null || !filename.contains(".")) {
            return ".jpg"; // Default extension
        }
        return filename.substring(filename.lastIndexOf("."));
    }

    @Override
    public boolean deleteFile(String fileUrl) {
        try {
            // Extract filename from URL
            String filename = fileUrl.substring(fileUrl.lastIndexOf("/") + 1);
            String folder = fileUrl.contains("/files/") 
                ? fileUrl.substring(fileUrl.indexOf("/files/") + 7, fileUrl.lastIndexOf("/"))
                : "profiles";
            
            Path filePath = Paths.get(imagesDirectory, folder, filename);
            boolean deleted = Files.deleteIfExists(filePath);
            if (deleted) {
                log.info("File deleted successfully: {}", fileUrl);
            }
            return deleted;
        } catch (Exception e) {
            log.error("Error deleting file: {}", fileUrl, e);
            return false;
        }
    }

    @Override
    public boolean deleteFileByEntity(String folder, String entityType, String entityId) {
        try {
            Path uploadDir = Paths.get(imagesDirectory, folder);
            
            // Try common extensions if the exact one doesn't exist
            List<String> extensions = Arrays.asList(".jpg", ".jpeg", ".png", ".gif");
            boolean deleted = false;
            
            for (String ext : extensions) {
                String testFilename = generateStandardizedFilename(entityType, entityId, ext);
                Path filePath = uploadDir.resolve(testFilename);
                if (Files.exists(filePath)) {
                    deleted = Files.deleteIfExists(filePath);
                    if (deleted) {
                        log.info("File deleted by entity: {}/{}/{}", folder, entityType, entityId);
                        break;
                    }
                }
            }
            
            return deleted;
        } catch (Exception e) {
            log.error("Error deleting file by entity: {}/{}/{}", folder, entityType, entityId, e);
            return false;
        }
    }

    private String getFileExtensionForEntity(String entityType) {
        // Default extension, will try others if file doesn't exist
        return ".jpg";
    }

    @Override
    public boolean isValidImageFile(MultipartFile file) {
        if (file == null || file.getContentType() == null) {
            return false;
        }
        String contentType = file.getContentType().toLowerCase();
        return contentType.equals("image/jpeg") 
            || contentType.equals("image/jpg") 
            || contentType.equals("image/png")
            || contentType.equals("image/gif");
    }
}

