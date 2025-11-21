package br.com.willianmendesf.system.controller;

import br.com.willianmendesf.system.model.dto.CreateVisitorDTO;
import br.com.willianmendesf.system.model.dto.VisitorDTO;
import br.com.willianmendesf.system.model.dto.VisitorGroupRequestDTO;
import br.com.willianmendesf.system.service.VisitorService;
import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/public/visitors")
@AllArgsConstructor
@Slf4j
public class PublicVisitorController {

    private final VisitorService visitorService;

    @PostMapping
    public ResponseEntity<VisitorDTO> createVisitor(@RequestBody CreateVisitorDTO dto) {
        try {
            log.info("Public request to create visitor: {}", dto.getNomeCompleto());
            log.info("Received DTO - eDeSP: {}, estado: {}", dto.getEDeSP(), dto.getEstado());
            VisitorDTO visitor = visitorService.create(dto);
            log.info("Created visitor - eDeSP: {}, estado: {}", visitor.getEDeSP(), visitor.getEstado());
            return ResponseEntity.status(HttpStatus.CREATED).body(visitor);
        } catch (Exception e) {
            log.error("Error creating visitor: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
        }
    }

    @PostMapping("/group")
    public ResponseEntity<VisitorDTO> createVisitorGroup(@RequestBody VisitorGroupRequestDTO dto) {
        try {
            log.info("Public request to create visitor group");
            VisitorDTO visitor = visitorService.createGroup(dto);
            log.info("Created visitor group with main visitor ID: {}", visitor.getId());
            return ResponseEntity.status(HttpStatus.CREATED).body(visitor);
        } catch (Exception e) {
            log.error("Error creating visitor group: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
        }
    }
}

