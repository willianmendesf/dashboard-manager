package br.com.willianmendesf.system.service;

import br.com.willianmendesf.system.exception.ImageException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.UUID;

@Slf4j
@Service
public class ImageService {

    @Value("${file.images-dir}")
    private String uploadDir;

    public String uploadImage(MultipartFile file) {
        try {
            String filename = UUID.randomUUID() + "_" + file.getOriginalFilename();
            Path filepath = Paths.get(uploadDir, filename);
            Files.copy(file.getInputStream(), filepath, StandardCopyOption.REPLACE_EXISTING);
            return filename;
        } catch (Exception e) {
            throw new ImageException("Error ao upload image", e);
        }
    }

    public Resource getImage(String filename) {
        try {
            Path filepath = Paths.get(uploadDir, filename);
            return new UrlResource(filepath.toUri());
        } catch (Exception e) {
            throw new ImageException("Error to get image", e);
        }
    }
}
