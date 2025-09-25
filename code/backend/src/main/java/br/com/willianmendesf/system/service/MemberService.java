package br.com.willianmendesf.system.service;

import br.com.willianmendesf.system.exception.MembersException;
import br.com.willianmendesf.system.exception.UserException;
import br.com.willianmendesf.system.model.dto.MemberDTO;
import br.com.willianmendesf.system.model.entity.MemberEntity;
import br.com.willianmendesf.system.repository.MemberRepository;
import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.List;

@Slf4j
@Service
@AllArgsConstructor
public class MemberService {

    private final MemberRepository repository;

    public List<MemberDTO> getAll() {
        try {
            log.info("Fetching all appointments from the database");
            return repository.findAll().stream().map(MemberDTO::new).toList();
        } catch (Exception e) {
            throw new MembersException("Error to return values" ,e);
        }
    }

    public MemberDTO getById(Long id) {
        try {
            log.info("Fetching appointment with ID: {}", id);
            MemberEntity entity = repository.findById(id).orElse(null);
            if (entity == null) throw new MembersException("Cadastro not found for ID: " + id);
            return new MemberDTO(entity);
        } catch (Exception e) {
            throw new MembersException("ID " + id + " not found");
        }
    }

    public void create(MemberEntity member) {
        try {
            log.info("Creating new appointment!");
            MemberEntity saved = repository.save(member);
            new MemberDTO(saved);
        } catch (Exception e) {
            throw new MembersException("Error to create new appointment", e);
        }
    }

    public MemberEntity updateById(Long id, MemberEntity member) {
        log.info("Updating user: {}", member.getNome());
        try {
            MemberEntity originalMember = repository.findById(id)
                    .orElseThrow(() -> new MembersException("User not found for id " + id));

            MemberEntity updatedUser = new MemberEntity(member, originalMember);

            return repository.save(updatedUser);
        } catch (Exception e) {
            throw new UserException("Error updating user", e);
        }
    }

    public void delete(Long id) {
        try {
            log.info("Deleting appointment with ID: {}", id);
            if (!repository.existsById(id)) throw new RuntimeException("Cadastro não encontrado para o ID: " + id);
            repository.deleteById(id);
        } catch (Exception e) {
            throw new MembersException("Error to delete appointment with ID: " + id, e);
        }
    }
}
