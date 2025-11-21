package br.com.willianmendesf.system.controller;

import br.com.willianmendesf.system.model.dto.GroupDTO;
import br.com.willianmendesf.system.model.dto.MemberDTO;
import br.com.willianmendesf.system.model.dto.UpdateMemberDTO;
import br.com.willianmendesf.system.service.GroupService;
import br.com.willianmendesf.system.service.MemberService;
import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Controller público para atualização cadastral de membros
 * Endpoints acessíveis sem autenticação
 */
@RestController
@RequestMapping("/public/members")
@AllArgsConstructor
@Slf4j
public class PublicMemberController {

    private final MemberService memberService;
    private final GroupService groupService;

    /**
     * Busca um membro por CPF (público)
     * GET /api/v1/public/members/cpf/{cpf}
     */
    @GetMapping("/cpf/{cpf}")
    public ResponseEntity<MemberDTO> getMemberByCpf(@PathVariable String cpf) {
        try {
            log.info("Public request to get member by CPF: {}", cpf);
            MemberDTO member = memberService.findMemberByCpf(cpf);
            return ResponseEntity.ok(member);
        } catch (Exception e) {
            log.error("Error getting member by CPF: {}", cpf, e);
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        }
    }

    /**
     * Atualiza um membro por CPF (público)
     * PUT /api/v1/public/members/cpf/{cpf}
     * Regra "Write-Once": O CPF na URL é usado para buscar o membro,
     * mas o CPF nunca pode ser alterado através deste endpoint
     */
    @PutMapping("/cpf/{cpf}")
    public ResponseEntity<MemberDTO> updateMemberByCpf(
            @PathVariable String cpf,
            @RequestBody UpdateMemberDTO memberData) {
        try {
            log.info("Public request to update member by CPF: {}", cpf);
            
            // Garantir que o CPF não esteja no DTO (write-once protection)
            // O CPF é sempre obtido da URL, nunca do body
            
            MemberDTO updatedMember = memberService.updateMemberByCpf(cpf, memberData);
            return ResponseEntity.ok(updatedMember);
        } catch (Exception e) {
            log.error("Error updating member by CPF: {}", cpf, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * Busca todos os grupos disponíveis (público)
     * GET /api/v1/public/members/groups
     */
    @GetMapping("/groups")
    public ResponseEntity<List<GroupDTO>> getAllGroups() {
        try {
            log.info("Public request to get all groups");
            List<GroupDTO> groups = groupService.getAll();
            return ResponseEntity.ok(groups);
        } catch (Exception e) {
            log.error("Error getting all groups", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * Busca um membro por telefone (público)
     * GET /api/v1/public/members/by-phone/{phone}
     */
    @GetMapping("/by-phone/{phone}")
    public ResponseEntity<MemberDTO> getMemberByPhone(@PathVariable String phone) {
        try {
            log.info("Public request to get member by phone: {}", phone);
            MemberDTO member = memberService.findMemberByPhone(phone);
            if (member == null) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
            }
            return ResponseEntity.ok(member);
        } catch (Exception e) {
            log.error("Error getting member by phone: {}", phone, e);
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        }
    }
}

