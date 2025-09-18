package br.com.willianmendesf.system.controller;

import br.com.willianmendesf.system.model.CadastroEntity;
import br.com.willianmendesf.system.model.dto.CadastroDTO;
import br.com.willianmendesf.system.service.CadastroService;
import lombok.AllArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/cadastro")
@AllArgsConstructor
public class CadastroController {

    private final CadastroService service;

    @GetMapping
    public ResponseEntity<List<CadastroDTO>> getAll() {
        return ResponseEntity.ok(service.getAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<CadastroDTO> getById(@PathVariable Long id) {
        CadastroDTO response = service.getById(id);
        return ResponseEntity.ok(response);
    }

    @PostMapping
    public ResponseEntity<Object> createNew(@RequestBody CadastroEntity cadastro) {
        service.create(cadastro);
        return ResponseEntity.status(HttpStatus.CREATED).build();
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Object> deleteCadastro(@PathVariable Long id) {
        service.delete(id);
        return ResponseEntity.status(HttpStatus.OK).build();
    }
}
