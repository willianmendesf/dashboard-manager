package br.com.willianmendesf.system.controller;

import br.com.willianmendesf.system.model.dto.ImportResultDTO;
import br.com.willianmendesf.system.model.dto.UpdateVisitorDTO;
import br.com.willianmendesf.system.model.dto.VisitorDTO;
import br.com.willianmendesf.system.model.dto.VisitorStatsDTO;
import br.com.willianmendesf.system.service.VisitorImportService;
import br.com.willianmendesf.system.service.VisitorService;
import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/visitors")
@AllArgsConstructor
@Slf4j
public class VisitorController {

    private final VisitorService visitorService;
    private final VisitorImportService visitorImportService;

    @GetMapping
    @PreAuthorize("hasAuthority('READ_VISITORS')")
    public ResponseEntity<List<VisitorDTO>> getAllVisitors(
            @RequestParam(required = false) LocalDate date,
            @RequestParam(required = false) String nome) {
        try {
            log.info("Getting visitors with filters - date: {}, nome: {}", date, nome);
            
            List<VisitorDTO> visitors;
            if (date != null) {
                visitors = visitorService.getByDate(date);
            } else if (nome != null && !nome.trim().isEmpty()) {
                visitors = visitorService.searchByName(nome);
            } else {
                visitors = visitorService.getAll();
            }
            
            return ResponseEntity.ok(visitors);
        } catch (Exception e) {
            log.error("Error getting visitors", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAuthority('READ_VISITORS')")
    public ResponseEntity<VisitorDTO> getVisitorById(@PathVariable Long id) {
        try {
            log.info("Getting visitor by ID: {}", id);
            VisitorDTO visitor = visitorService.getById(id);
            return ResponseEntity.ok(visitor);
        } catch (Exception e) {
            log.error("Error getting visitor by ID: {}", id, e);
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        }
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority('WRITE_VISITORS')")
    public ResponseEntity<VisitorDTO> updateVisitor(@PathVariable Long id, @RequestBody UpdateVisitorDTO dto) {
        try {
            log.info("Updating visitor with ID: {}", id);
            VisitorDTO visitor = visitorService.update(id, dto);
            return ResponseEntity.ok(visitor);
        } catch (Exception e) {
            log.error("Error updating visitor with ID: {}", id, e);
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
        }
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAuthority('DELETE_VISITORS')")
    public ResponseEntity<Void> deleteVisitor(@PathVariable Long id) {
        try {
            log.info("Deleting visitor with ID: {}", id);
            visitorService.delete(id);
            return ResponseEntity.noContent().build();
        } catch (Exception e) {
            log.error("Error deleting visitor with ID: {}", id, e);
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        }
    }

    @GetMapping("/stats")
    @PreAuthorize("hasAuthority('READ_VISITORS')")
    public ResponseEntity<List<VisitorStatsDTO>> getVisitorStats(
            @RequestParam(required = false) LocalDate startDate,
            @RequestParam(required = false) LocalDate endDate) {
        try {
            log.info("Getting visitor statistics - startDate: {}, endDate: {}", startDate, endDate);
            List<VisitorStatsDTO> stats = visitorService.getVisitorStatsByDateRange(startDate, endDate);
            return ResponseEntity.ok(stats);
        } catch (Exception e) {
            log.error("Error getting visitor statistics", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @GetMapping("/stats/sundays")
    @PreAuthorize("hasAuthority('READ_VISITORS')")
    public ResponseEntity<List<VisitorStatsDTO>> getSundayStats() {
        try {
            log.info("Getting Sunday visitors statistics");
            List<VisitorStatsDTO> stats = visitorService.getSundayVisitorsStats();
            return ResponseEntity.ok(stats);
        } catch (Exception e) {
            log.error("Error getting Sunday statistics", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @PostMapping("/{id}/upload-foto")
    @PreAuthorize("hasAuthority('WRITE_VISITORS')")
    public ResponseEntity<?> uploadVisitorPhoto(
            @PathVariable Long id,
            @RequestParam("file") MultipartFile file) {
        
        if (file == null || file.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "File is required"));
        }

        try {
            VisitorDTO visitor = visitorService.uploadPhoto(id, file);
            return ResponseEntity.ok(Map.of("fotoUrl", visitor.getFotoUrl(), "visitor", visitor));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            log.error("Error uploading photo for visitor ID: {}", id, e);
            return ResponseEntity.internalServerError().body(Map.of("error", "Error uploading photo"));
        }
    }

    @GetMapping("/import/template")
    @PreAuthorize("hasAuthority('WRITE_VISITORS')")
    public ResponseEntity<ByteArrayResource> downloadTemplate() {
        try {
            byte[] templateBytes = visitorImportService.generateTemplate();
            ByteArrayResource resource = new ByteArrayResource(templateBytes);
            
            HttpHeaders headers = new HttpHeaders();
            headers.add(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=modelo_importacao_visitantes.xlsx");
            headers.add(HttpHeaders.CONTENT_TYPE, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
            
            return ResponseEntity.ok()
                    .headers(headers)
                    .contentLength(templateBytes.length)
                    .contentType(MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"))
                    .body(resource);
        } catch (Exception e) {
            log.error("Error generating template", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @PostMapping("/import")
    @PreAuthorize("hasAuthority('WRITE_VISITORS')")
    public ResponseEntity<ImportResultDTO> importVisitors(@RequestParam("file") MultipartFile file) {
        try {
            log.info("Importing visitors from file: {}", file.getOriginalFilename());
            ImportResultDTO result = visitorImportService.importVisitors(file);
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            log.error("Error importing visitors", e);
            ImportResultDTO errorResult = new ImportResultDTO();
            errorResult.addError(0, "Erro ao importar visitantes: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResult);
        }
    }
}

