package br.com.willianmendesf.system.service;

import br.com.willianmendesf.system.exception.ImageException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.*;
import java.nio.file.attribute.FileAttribute;
import java.nio.file.attribute.PosixFilePermission;
import java.nio.file.attribute.PosixFilePermissions;
import java.util.Set;
import java.util.UUID;

@Slf4j
@Service
public class ImageService {

    @Value("${file.images-dir}")
    private String uploadDir;

    public String uploadImage(MultipartFile file) {
        log.info("Uploading file: {}", file.getOriginalFilename());
        try {
            Path uploadPath = Paths.get(uploadDir);

            if (Files.notExists(uploadPath)) {
                Set<PosixFilePermission> perms = PosixFilePermissions.fromString("rwxr-xr-x");
                FileAttribute<Set<PosixFilePermission>> fileAttributes = PosixFilePermissions.asFileAttribute(perms);

                try {
                    Files.createDirectories(uploadPath, fileAttributes);
                } catch (UnsupportedOperationException e) {
                    Files.createDirectories(uploadPath);
                    System.err.println("Atenção: Sistema de arquivos não suporta POSIX. Permissões não foram definidas.");
                } catch (AccessDeniedException e) {
                    throw new AccessDeniedException("Falha ao criar o diretório. Verifique as permissões de escrita no diretório pai.");
                }
            }

            String filename = UUID.randomUUID() + "_" + file.getOriginalFilename();
            Path filepath = uploadPath.resolve(filename);

            Files.copy(file.getInputStream(), filepath, StandardCopyOption.REPLACE_EXISTING);

            log.info("File uploaded successfully: {}", file.getOriginalFilename());
            return filename;
        } catch (IOException e) {
            throw new ImageException("Erro de I/O (permissão ou disco) ao fazer upload: " + e.getMessage(), e);
        } catch (Exception e) {
            throw new ImageException("Erro ao fazer upload da imagem", e);
        }
    }

    public Resource getImage(String filename) {
        log.info("Retrieving file: {}", filename);
        try {
            Path filepath = Paths.get(uploadDir, filename);
            if (!Files.exists(filepath)) throw new ImageException("Image not found: " + filename, null);
            log.info("File retrieved successfully: {}", filename);
            return new UrlResource(filepath.toUri());
        } catch (Exception e) {
            throw new ImageException("Error to get image", e);
        }
    }
}
