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

            // Determine if we should keep PNG format (for logo and favicon)
            boolean keepPngFormat = isPngFormatEntity(entityType);
            String extension = keepPngFormat ? ".png" : ".jpg";
            
            // Generate standardized filename with appropriate extension
            String filename = generateStandardizedFilename(entityType, entityId, extension);
            Path filePath = uploadDir.resolve(filename);

            // Delete old file if exists (overwrite strategy)
            // Also try to delete with other extensions
            deleteOldFiles(uploadDir, entityType, entityId);

            // Process image: resize and convert/keep format
            byte[] processedImage = processImage(file, keepPngFormat);
            
            // Save processed image
            Files.write(filePath, processedImage);

            // Return relative URL (works in all environments)
            String publicUrl = String.format("/api/v1/files/%s/%s", folder, filename);
            log.info("File uploaded, processed and saved successfully: {}", publicUrl);
            return publicUrl;

        } catch (IOException e) {
            log.error("Error uploading file", e);
            throw new RuntimeException("Failed to upload file: " + e.getMessage(), e);
        }
    }

    /**
     * Processes image: resizes to max 350px and converts to JPG or keeps PNG
     * @param file Original image file
     * @param keepPngFormat If true, keeps PNG format; if false, converts to JPG
     * @return Processed image as byte array
     */
    private byte[] processImage(MultipartFile file, boolean keepPngFormat) throws IOException {
        try (InputStream inputStream = file.getInputStream()) {
            // Read original image
            BufferedImage originalImage = ImageIO.read(inputStream);
            
            if (originalImage == null) {
                throw new IOException("Unable to read image from file");
            }

            // Resize image to max 350px (width or height) maintaining aspect ratio
            BufferedImage resizedImage = resizeImage(originalImage, 350);

            ByteArrayOutputStream baos = new ByteArrayOutputStream();
            
            if (keepPngFormat) {
                // Keep PNG format (for logo and favicon)
                ImageIO.write(resizedImage, "png", baos);
            } else {
                // Convert to JPG and compress
                BufferedImage jpgImage;
                if (resizedImage.getType() == BufferedImage.TYPE_INT_RGB) {
                    jpgImage = resizedImage;
                } else {
                    jpgImage = new BufferedImage(
                        resizedImage.getWidth(),
                        resizedImage.getHeight(),
                        BufferedImage.TYPE_INT_RGB
                    );
                    Graphics2D g = jpgImage.createGraphics();
                    g.setComposite(AlphaComposite.Src);
                    g.setRenderingHint(RenderingHints.KEY_RENDERING, RenderingHints.VALUE_RENDER_QUALITY);
                    g.setRenderingHint(RenderingHints.KEY_ANTIALIASING, RenderingHints.VALUE_ANTIALIAS_ON);
                    g.drawImage(resizedImage, 0, 0, null);
                    g.dispose();
                }

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
                    param.setCompressionQuality(imageQuality);
                }
                
                // Write image
                writer.write(null, new javax.imageio.IIOImage(jpgImage, null, null), param);
                writer.dispose();
                ios.close();
            }
            
            return baos.toByteArray();
        }
    }

    /**
     * Resizes image to maximum dimension (width or height) maintaining aspect ratio
     * @param originalImage Original image to resize
     * @param maxDimension Maximum width or height in pixels
     * @return Resized BufferedImage
     */
    private BufferedImage resizeImage(BufferedImage originalImage, int maxDimension) {
        int originalWidth = originalImage.getWidth();
        int originalHeight = originalImage.getHeight();
        
        // If image is already smaller than max dimension, return original
        if (originalWidth <= maxDimension && originalHeight <= maxDimension) {
            return originalImage;
        }
        
        // Calculate new dimensions maintaining aspect ratio
        double scale;
        if (originalWidth > originalHeight) {
            scale = (double) maxDimension / originalWidth;
        } else {
            scale = (double) maxDimension / originalHeight;
        }
        
        int newWidth = (int) Math.round(originalWidth * scale);
        int newHeight = (int) Math.round(originalHeight * scale);
        
        // Create resized image with high quality rendering
        BufferedImage resizedImage = new BufferedImage(newWidth, newHeight, originalImage.getType());
        Graphics2D g = resizedImage.createGraphics();
        g.setRenderingHint(RenderingHints.KEY_INTERPOLATION, RenderingHints.VALUE_INTERPOLATION_BILINEAR);
        g.setRenderingHint(RenderingHints.KEY_RENDERING, RenderingHints.VALUE_RENDER_QUALITY);
        g.setRenderingHint(RenderingHints.KEY_ANTIALIASING, RenderingHints.VALUE_ANTIALIAS_ON);
        g.drawImage(originalImage, 0, 0, newWidth, newHeight, null);
        g.dispose();
        
        log.info("Image resized from {}x{} to {}x{}", originalWidth, originalHeight, newWidth, newHeight);
        return resizedImage;
    }

    /**
     * Checks if entity type should keep PNG format
     * @param entityType Entity type (logo, favicon, etc.)
     * @return true if should keep PNG, false otherwise
     */
    private boolean isPngFormatEntity(String entityType) {
        String normalizedType = entityType.toLowerCase().trim();
        return "logo".equals(normalizedType) || "logos".equals(normalizedType) 
            || "favicon".equals(normalizedType) || "favicons".equals(normalizedType);
    }

    /**
     * Deletes old files with any extension for the given entity
     */
    private void deleteOldFiles(Path uploadDir, String entityType, String entityId) {
        try {
            List<String> extensions = Arrays.asList(".jpg", ".jpeg", ".png", ".gif", ".webp", ".ico");
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
     * - Logo: logo_empresa.png (if PNG format)
     * - Favicon: favicon_empresa.png (if PNG format)
     * - User photo: usuario_id_123.jpg
     * - Member photo: membro_id_456.jpg
     * - Appointment image: agendamento_id_789.jpg
     * 
     * @param entityType Entity type
     * @param entityId Entity ID
     * @param extension File extension (.png or .jpg)
     * @return Standardized filename
     */
    private String generateStandardizedFilename(String entityType, String entityId, String extension) {
        // Normalize entity type
        String normalizedType = entityType.toLowerCase().trim();
        
        // Special case for logo (always uses "empresa" as ID)
        if ("logo".equals(normalizedType) || "logos".equals(normalizedType)) {
            return String.format("logo_empresa%s", extension);
        }
        
        // Special case for favicon (always uses "empresa" as ID)
        if ("favicon".equals(normalizedType) || "favicons".equals(normalizedType)) {
            return String.format("favicon_empresa%s", extension);
        }
        
        // For other entities, use pattern: {entityType}_id_{entityId}.{ext}
        return String.format("%s_id_%s%s", normalizedType, entityId, extension);
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

