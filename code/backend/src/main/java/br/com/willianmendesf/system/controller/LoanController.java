package br.com.willianmendesf.system.controller;

import br.com.willianmendesf.system.model.dto.LoanDTO;
import br.com.willianmendesf.system.service.LoanService;
import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/loans")
@AllArgsConstructor
@Slf4j
public class LoanController {

    private final LoanService loanService;

    @GetMapping
    @PreAuthorize("hasAuthority('READ_MEMBERS')")
    public ResponseEntity<List<LoanDTO>> getAll() {
        try {
            log.info("Getting all loans");
            return ResponseEntity.ok(loanService.getAll());
        } catch (Exception e) {
            log.error("Error getting all loans", e);
            return ResponseEntity.internalServerError().build();
        }
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAuthority('READ_MEMBERS')")
    public ResponseEntity<LoanDTO> getById(@PathVariable Long id) {
        try {
            log.info("Getting loan by ID: {}", id);
            return ResponseEntity.ok(loanService.getById(id));
        } catch (Exception e) {
            log.error("Error getting loan by ID: {}", id, e);
            return ResponseEntity.notFound().build();
        }
    }

    @PatchMapping("/{id}/return")
    @PreAuthorize("hasAuthority('WRITE_MEMBERS')")
    public ResponseEntity<LoanDTO> markAsReturned(@PathVariable Long id) {
        try {
            log.info("Marking loan as returned: {}", id);
            return ResponseEntity.ok(loanService.markAsReturned(id));
        } catch (Exception e) {
            log.error("Error marking loan as returned: {}", id, e);
            return ResponseEntity.badRequest().build();
        }
    }
}

