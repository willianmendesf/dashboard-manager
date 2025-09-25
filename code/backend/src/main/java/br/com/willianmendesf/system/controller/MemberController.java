package br.com.willianmendesf.system.controller;

import br.com.willianmendesf.system.model.dto.MemberDTO;
import br.com.willianmendesf.system.model.entity.MemberEntity;
import br.com.willianmendesf.system.service.MemberService;
import lombok.AllArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/members")
@AllArgsConstructor
public class MemberController {

    private final MemberService service;

    @GetMapping
    public ResponseEntity<List<MemberDTO>> getAll() {
        return ResponseEntity.ok(service.getAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<MemberDTO> getById(@PathVariable Long id) {
        MemberDTO response = service.getById(id);
        return ResponseEntity.ok(response);
    }

    @PostMapping
    public ResponseEntity<Object> create(@RequestBody MemberEntity member) {
        service.create(member);
        return ResponseEntity.status(HttpStatus.CREATED).build();
    }

    @PatchMapping("/{id}")
    public ResponseEntity<HttpStatus> updateUserById(@PathVariable Long id, @RequestBody MemberEntity member) {
        MemberEntity createdUserEntity = service.updateById(id, member);
        return ResponseEntity.status(201).body(HttpStatus.CREATED);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Object> delete(@PathVariable Long id) {
        service.delete(id);
        return ResponseEntity.ok().build();
    }
}
