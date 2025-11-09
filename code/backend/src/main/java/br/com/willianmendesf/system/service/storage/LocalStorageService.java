package br.com.willianmendesf.system.service.storage;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import javax.imageio.ImageIO;
import java.awt.*;
import java.awt.image.BufferedImage;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.Arrays;
import java.util.Iterator;
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

    @Value("${image.quality:0.75}")
    private float imageQuality = 0.75f; // 75% quality by default

    @Override
    public String uploadFile(MultipartFile file, String folder, String entityType, String entityId) {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("File cannot be null or empty");
        }

        if (!isValidImageFile(file)) {
            throw new IllegalArgumentException("Invalid image file. Only JPEG, PNG, GIF, and WEBP are allowed.");
        }

        try {
            // Create directory if it doesn't exist
            Path uploadDir = Paths.get(imagesDirectory, folder);
            Files.createDirectories(uploadDir);

            // Generate standardized filename - ALWAYS .jpg
            String filename = generateStandardizedFilename(entityType, entityId, ".jpg");
            Path filePath = uploadDir.resolve(filename);

            // Delete old file if exists (overwrite strategy)
            // Also try to delete with other extensions
            deleteOldFiles(uploadDir, entityType, entityId);

            // Convert and compress image to JPG
            byte[] compressedImage = convertAndCompressToJpg(file, imageQuality);
            
            // Save compressed JPG file
            Files.write(filePath, compressedImage);

            // Return public URL
            String publicUrl = String.format("%s/api/v1/files/%s/%s", baseUrl, folder, filename);
            log.info("File uploaded, converted to JPG and compressed successfully: {}", publicUrl);
            return publicUrl;

        } catch (IOException e) {
            log.error("Error uploading file", e);
            throw new RuntimeException("Failed to upload file: " + e.getMessage(), e);
        }
    }

    /**
     * Converts any image format to JPG and compresses it
     * @param file Original image file
     * @param quality Compression quality (0.0 to 1.0)
     * @return Compressed JPG as byte array
     */
    private byte[] convertAndCompressToJpg(MultipartFile file, float quality) throws IOException {
        try (InputStream inputStream = file.getInputStream()) {
            // Read original image
            BufferedImage originalImage = ImageIO.read(inputStream);
            
            if (originalImage == null) {
                throw new IOException("Unable to read image from file");
            }

            // Convert to RGB if necessary (handles PNG transparency, etc.)
            BufferedImage jpgImage;
            if (originalImage.getType() == BufferedImage.TYPE_INT_RGB) {
                jpgImage = originalImage;
            } else {
                jpgImage = new BufferedImage(
                    originalImage.getWidth(),
                    originalImage.getHeight(),
                    BufferedImage.TYPE_INT_RGB
                );
                Graphics2D g = jpgImage.createGraphics();
                g.setComposite(AlphaComposite.Src);
                g.setRenderingHint(RenderingHints.KEY_RENDERING, RenderingHints.VALUE_RENDER_QUALITY);
                g.setRenderingHint(RenderingHints.KEY_ANTIALIASING, RenderingHints.VALUE_ANTIALIAS_ON);
                g.drawImage(originalImage, 0, 0, null);
                g.dispose();
            }

            // Compress and write to byte array
            ByteArrayOutputStream baos = new ByteArrayOutputStream();
            
            // Get JPEG writer
            Iterator<javax.imageio.ImageWriter> writers = ImageIO.getImageWritersByFormatName("jpg");
            if (!writers.hasNext()) {
                throw new IOException("No JPEG writer available");
            }
            
            javax.imageio.ImageWriter writer = writers.next();
            javax.imageio.stream.ImageOutputStream ios = ImageIO.createImageOutputStream(baos);
            writer.setOutput(ios);
            
            // Set compression quality
            javax.imageio.ImageWriteParam param = writer.getDefaultWriteParam();
            if (param.canWriteCompressed()) {
                param.setCompressionMode(javax.imageio.ImageWriteParam.MODE_EXPLICIT);
                param.setCompressionQuality(quality);
            }
            
            // Write image
            writer.write(null, new javax.imageio.IIOImage(jpgImage, null, null), param);
            writer.dispose();
            ios.close();
            
            return baos.toByteArray();
        }
    }

    /**
     * Deletes old files with any extension for the given entity
     */
    private void deleteOldFiles(Path uploadDir, String entityType, String entityId) {
        try {
            List<String> extensions = Arrays.asList(".jpg", ".jpeg", ".png", ".gif", ".webp");
            for (String ext : extensions) {
                String testFilename = generateStandardizedFilename(entityType, entityId, ext);
                Path filePath = uploadDir.resolve(testFilename);
                if (Files.exists(filePath)) {
                    Files.delete(filePath);
                    log.info("Deleted old file for overwrite: {}", testFilename);
                }
            }
        } catch (IOException e) {
            log.warn("Error deleting old files, continuing anyway: {}", e.getMessage());
        }
    }

    /**
     * Generates a standardized filename based on entity type and ID
     * Examples:
     * - Logo: logo_empresa.jpg
     * - User photo: usuario_id_123.jpg
     * - Member photo: membro_id_456.jpg
     * - Appointment image: agendamento_id_789.jpg
     * 
     * Note: Always returns .jpg extension regardless of input
     */
    private String generateStandardizedFilename(String entityType, String entityId, String extension) {
        // Normalize entity type
        String normalizedType = entityType.toLowerCase().trim();
        
        // Always use .jpg extension
        String jpgExtension = ".jpg";
        
        // Special case for logo (always uses "empresa" as ID)
        if ("logo".equals(normalizedType) || "logos".equals(normalizedType)) {
            return String.format("logo_empresa%s", jpgExtension);
        }
        
        // For other entities, use pattern: {entityType}_id_{entityId}.jpg
        return String.format("%s_id_%s%s", normalizedType, entityId, jpgExtension);
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

    @Override
    public boolean isValidImageFile(MultipartFile file) {
        if (file == null || file.getContentType() == null) {
            return false;
        }
        String contentType = file.getContentType().toLowerCase();
        return contentType.equals("image/jpeg") 
            || contentType.equals("image/jpg") 
            || contentType.equals("image/png")
            || contentType.equals("image/gif")
            || contentType.equals("image/webp");
    }
}

