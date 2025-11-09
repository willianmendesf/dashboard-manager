package br.com.willianmendesf.system.service.storage;

import org.springframework.web.multipart.MultipartFile;

/**
 * Interface for file storage services (S3, MinIO, etc.)
 */
public interface StorageService {
    /**
     * Uploads a file and returns its public URL
     * Uses overwrite strategy: if a file with the same entityType and entityId exists, it will be replaced
     * 
     * @param file The file to upload
     * @param folder The folder/path where the file should be stored (e.g., "profiles", "logos")
     * @param entityType The type of entity (e.g., "usuario", "membro", "logo", "agendamento")
     * @param entityId The ID of the entity (e.g., "123", "empresa" for logo)
     * @return The public URL of the uploaded file
     * @throws IllegalArgumentException if file is invalid
     * @throws RuntimeException if upload fails
     */
    String uploadFile(MultipartFile file, String folder, String entityType, String entityId);

    /**
     * Legacy method for backward compatibility
     * @deprecated Use uploadFile(file, folder, entityType, entityId) instead
     */
    @Deprecated
    default String uploadFile(MultipartFile file, String folder) {
        return uploadFile(file, folder, "generic", java.util.UUID.randomUUID().toString());
    }

    /**
     * Deletes a file from storage
     * @param fileUrl The URL of the file to delete
     * @return true if deletion was successful, false otherwise
     */
    boolean deleteFile(String fileUrl);

    /**
     * Deletes a file by entity type and ID
     * @param folder The folder where the file is stored
     * @param entityType The type of entity
     * @param entityId The ID of the entity
     * @return true if deletion was successful, false otherwise
     */
    boolean deleteFileByEntity(String folder, String entityType, String entityId);

    /**
     * Validates if the file is a valid image
     * @param file The file to validate
     * @return true if valid, false otherwise
     */
    boolean isValidImageFile(MultipartFile file);
}

