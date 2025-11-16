package br.com.willianmendesf.system.controller;

import br.com.willianmendesf.system.model.dto.BookDTO;
import br.com.willianmendesf.system.model.entity.BookEntity;
import br.com.willianmendesf.system.service.BookService;
import br.com.willianmendesf.system.service.storage.StorageService;
import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/books")
@AllArgsConstructor
@Slf4j
public class BookController {

    private final BookService bookService;
    private final StorageService storageService;

    @GetMapping
    @PreAuthorize("hasAuthority('READ_MEMBERS')")
    public ResponseEntity<List<BookDTO>> getAll() {
        try {
            log.info("Getting all books");
            return ResponseEntity.ok(bookService.getAll());
        } catch (Exception e) {
            log.error("Error getting all books", e);
            return ResponseEntity.internalServerError().build();
        }
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAuthority('READ_MEMBERS')")
    public ResponseEntity<BookDTO> getById(@PathVariable Long id) {
        try {
            log.info("Getting book by ID: {}", id);
            return ResponseEntity.ok(bookService.getById(id));
        } catch (Exception e) {
            log.error("Error getting book by ID: {}", id, e);
            return ResponseEntity.notFound().build();
        }
    }

    @PostMapping
    @PreAuthorize("hasAuthority('WRITE_MEMBERS')")
    public ResponseEntity<BookDTO> create(@RequestBody BookEntity book) {
        try {
            log.info("Creating book: {}", book.getTitulo());
            return ResponseEntity.ok(bookService.create(book));
        } catch (Exception e) {
            log.error("Error creating book", e);
            return ResponseEntity.badRequest().build();
        }
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAuthority('WRITE_MEMBERS')")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        try {
            log.info("Deleting book with ID: {}", id);
            bookService.delete(id);
            return ResponseEntity.noContent().build();
        } catch (Exception e) {
            log.error("Error deleting book with ID: {}", id, e);
            return ResponseEntity.badRequest().build();
        }
    }

    @PostMapping("/{id}/upload-foto")
    @PreAuthorize("hasAuthority('WRITE_MEMBERS')")
    public ResponseEntity<BookDTO> uploadPhoto(
            @PathVariable Long id,
            @RequestParam("file") MultipartFile file) {
        try {
            log.info("Uploading photo for book ID: {}", id);
            
            if (file == null || file.isEmpty()) {
                return ResponseEntity.badRequest().build();
            }

            if (!storageService.isValidImageFile(file)) {
                return ResponseEntity.badRequest().build();
            }

            // Upload file to storage
            String fotoUrl = storageService.uploadFile(
                file, 
                "books", 
                "livro", 
                id.toString()
            );
            
            // Update book photo URL
            BookEntity bookEntity = new BookEntity();
            bookEntity.setFotoUrl(fotoUrl);
            
            BookDTO updated = bookService.update(id, bookEntity);
            
            return ResponseEntity.ok(updated);
        } catch (Exception e) {
            log.error("Error uploading photo for book ID: {}", id, e);
            return ResponseEntity.internalServerError().build();
        }
    }
}

