package br.com.willianmendesf.system.controller;

import br.com.willianmendesf.system.model.dto.BookDTO;
import br.com.willianmendesf.system.model.dto.CreateLoanDTO;
import br.com.willianmendesf.system.model.dto.LoanDTO;
import br.com.willianmendesf.system.service.BookService;
import br.com.willianmendesf.system.service.LoanService;
import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/public/loans")
@AllArgsConstructor
@Slf4j
public class PublicLoanController {

    private final LoanService loanService;
    private final BookService bookService;

    @GetMapping("/available-books")
    public ResponseEntity<List<BookDTO>> getAvailableBooks() {
        try {
            log.info("Public request to get available books");
            return ResponseEntity.ok(bookService.getAvailableBooks());
        } catch (Exception e) {
            log.error("Error getting available books", e);
            return ResponseEntity.internalServerError().build();
        }
    }

    @PostMapping
    public ResponseEntity<LoanDTO> createLoan(@RequestBody CreateLoanDTO dto) {
        try {
            log.info("Public request to create loan for book ID: {} and CPF: {}", dto.getBookId(), dto.getMemberCpf());
            LoanDTO loan = loanService.create(dto);
            return ResponseEntity.status(HttpStatus.CREATED).body(loan);
        } catch (ResponseStatusException e) {
            // CPF não encontrado - retornar 404 com mensagem
            log.warn("CPF not found: {}", dto.getMemberCpf());
            throw e;
        } catch (Exception e) {
            log.error("Error creating loan", e);
            Map<String, String> error = new HashMap<>();
            error.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
        }
    }
}

