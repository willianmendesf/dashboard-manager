package br.com.willianmendesf.system.controller;

import br.com.willianmendesf.system.model.dto.ImportResultDTO;
import br.com.willianmendesf.system.model.dto.MemberDTO;
import br.com.willianmendesf.system.model.dto.MemberSpouseDTO;
import br.com.willianmendesf.system.model.entity.MemberEntity;
import br.com.willianmendesf.system.repository.MemberRepository;
import br.com.willianmendesf.system.service.MemberImportService;
import br.com.willianmendesf.system.service.MemberService;
import br.com.willianmendesf.system.service.storage.StorageService;
import br.com.willianmendesf.system.service.utils.CPFUtil;
import br.com.willianmendesf.system.service.utils.RGUtil;
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

import java.util.List;

@RestController
@RequestMapping("/members")
@AllArgsConstructor
@Slf4j
public class MemberController {

    private final MemberService service;
    private final MemberRepository memberRepository;
    private final StorageService storageService;
    private final MemberImportService memberImportService;

    @GetMapping
    @PreAuthorize("hasAuthority('READ_MEMBERS')")
    public ResponseEntity<List<MemberEntity>> getAll() {
        return ResponseEntity.ok(service.getAll());
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAuthority('READ_MEMBERS')")
    public ResponseEntity<MemberDTO> getById(@PathVariable Long id) {
        MemberDTO response = service.getById(id);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/cpf/{cpf}")
    @PreAuthorize("hasAuthority('READ_MEMBERS')")
    public ResponseEntity<MemberEntity> getByCPF(@PathVariable String cpf) {
        MemberEntity response = service.getByCPF(cpf);
        return ResponseEntity.ok(response);
    }

    /**
     * GET /api/v1/members/cpf/{cpf}/spouse
     * Returns basic spouse information (nomeCompleto and fotoUrl) for relationship preview
     * Requires READ_MEMBERS permission
     */
    @GetMapping("/cpf/{cpf}/spouse")
    @PreAuthorize("hasAuthority('READ_MEMBERS')")
    public ResponseEntity<MemberSpouseDTO> getSpouseByCpf(@PathVariable String cpf) {
        try {
            MemberSpouseDTO spouse = service.getSpouseByCpf(cpf);
            if (spouse == null) {
                return ResponseEntity.notFound().build();
            }
            return ResponseEntity.ok(spouse);
        } catch (Exception e) {
            log.error("Error getting spouse by CPF: {}", cpf, e);
            return ResponseEntity.notFound().build();
        }
    }

    @PostMapping
    @PreAuthorize("hasAuthority('WRITE_MEMBERS')")
    public ResponseEntity<MemberDTO> create(@RequestBody MemberEntity member) {
        // O service.create() salva o membro, mas precisamos retornar o membro salvo com ID
        // Vamos salvar diretamente aqui para ter acesso ao membro criado
        try {
            if (member.getCpf() != null && !member.getCpf().trim().isEmpty()) {
                var cpf = CPFUtil.validateAndFormatCPF(member.getCpf());
                MemberEntity existMember = service.getByCPF(cpf);
                if (existMember != null) {
                    return ResponseEntity.status(HttpStatus.CONFLICT)
                        .body(new MemberDTO(existMember));
                }
                member.setCpf(cpf);
            }
            if (member.getRg() != null && !member.getRg().trim().isEmpty()) {
                member.setRg(RGUtil.validateAndFormatRG(member.getRg()));
            }
            MemberEntity savedMember = memberRepository.save(member);
            return ResponseEntity.status(HttpStatus.CREATED).body(new MemberDTO(savedMember));
        } catch (Exception e) {
            log.error("Error creating member", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @PatchMapping("/{id}")
    @PreAuthorize("hasAuthority('WRITE_MEMBERS')")
    public ResponseEntity<HttpStatus> updateUserById(@PathVariable Long id, @RequestBody MemberEntity member) {
        MemberEntity createdUserEntity = service.updateById(id, member);
        return ResponseEntity.status(201).body(HttpStatus.CREATED);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAuthority('DELETE_MEMBERS')")
    public ResponseEntity<Object> delete(@PathVariable Long id) {
        service.delete(id);
        return ResponseEntity.ok().build();
    }

    /**
     * POST /api/v1/members/{id}/upload-foto
     * Uploads profile photo for a specific member
     * Requires WRITE_MEMBERS permission
     */
    @PostMapping("/{id}/upload-foto")
    @PreAuthorize("hasAuthority('WRITE_MEMBERS')")
    public ResponseEntity<?> uploadMemberPhoto(
            @PathVariable Long id,
            @RequestParam("file") MultipartFile file) {
        
        if (file == null || file.isEmpty()) {
            return ResponseEntity.badRequest().body(java.util.Map.of("error", "File is required"));
        }

        if (!storageService.isValidImageFile(file)) {
            return ResponseEntity.badRequest().body(java.util.Map.of("error", "Invalid image file. Only JPEG, PNG and GIF are allowed."));
        }

        try {
            MemberEntity member = memberRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Member not found: " + id));

            // Upload file to storage with overwrite strategy
            // Uses standardized naming: membro_id_{memberId}.{ext}
            String fotoUrl = storageService.uploadFile(
                file, 
                "profiles", 
                "membro", 
                member.getId().toString()
            );
            
            // Delete old photo if exists (overwrite strategy)
            if (member.getFotoUrl() != null && !member.getFotoUrl().equals(fotoUrl)) {
                storageService.deleteFile(member.getFotoUrl());
            }
            
            // Update member's fotoUrl
            member.setFotoUrl(fotoUrl);
            MemberEntity updatedMember = memberRepository.save(member);
            
            log.info("Profile photo uploaded for member ID: {} (overwrite strategy)", id);
            
            return ResponseEntity.ok(java.util.Map.of("fotoUrl", fotoUrl, "member", new MemberDTO(updatedMember)));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(java.util.Map.of("error", e.getMessage()));
        } catch (Exception e) {
            log.error("Error uploading profile photo for member ID: {}", id, e);
            return ResponseEntity.internalServerError().body(java.util.Map.of("error", "Error uploading photo"));
        }
    }

    /**
     * POST /api/v1/members/import
     * Imports members from Excel (.xlsx) or CSV file
     * Requires WRITE_MEMBERS permission
     */
    @PostMapping("/import")
    @PreAuthorize("hasAuthority('WRITE_MEMBERS')")
    public ResponseEntity<ImportResultDTO> importMembers(@RequestParam("file") MultipartFile file) {
        try {
            if (file == null || file.isEmpty()) {
                ImportResultDTO errorResult = new ImportResultDTO();
                errorResult.addError(0, "Arquivo não fornecido ou vazio");
                return ResponseEntity.badRequest().body(errorResult);
            }

            ImportResultDTO result = memberImportService.importMembers(file);
            log.info("Import completed: {} success, {} errors", result.getSuccessCount(), result.getErrorCount());
            
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            log.error("Error importing members", e);
            ImportResultDTO errorResult = new ImportResultDTO();
            errorResult.addError(0, "Erro ao processar importação: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResult);
        }
    }

    /**
     * GET /api/v1/members/import/template
     * Downloads Excel template file for member import
     * Requires WRITE_MEMBERS permission
     */
    @GetMapping("/import/template")
    @PreAuthorize("hasAuthority('WRITE_MEMBERS')")
    public ResponseEntity<ByteArrayResource> downloadTemplate() {
        try {
            byte[] templateBytes = memberImportService.generateTemplate();
            ByteArrayResource resource = new ByteArrayResource(templateBytes);
            
            HttpHeaders headers = new HttpHeaders();
            headers.add(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=modelo_importacao_membros.xlsx");
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
}
