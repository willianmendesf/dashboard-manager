package br.com.willianmendesf.system.service;

import br.com.willianmendesf.system.exception.MembersException;
import br.com.willianmendesf.system.exception.UserException;
import br.com.willianmendesf.system.model.dto.MemberDTO;
import br.com.willianmendesf.system.model.entity.MemberEntity;
import br.com.willianmendesf.system.repository.MemberRepository;
import br.com.willianmendesf.system.service.utils.CPFUtil;
import br.com.willianmendesf.system.service.utils.RGUtil;
import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.List;

import static java.util.Objects.isNull;

@Slf4j
@Service
@AllArgsConstructor
public class MemberService {

    private final MemberRepository repository;

    public List<MemberEntity> getAll() {
        try {
            log.info("Getting all members from database");
            return repository.findAll().stream().map(MemberEntity::new).toList();
        } catch (Exception e) {
            throw new MembersException("Error to return values" ,e);
        }
    }

    public MemberDTO getById(Long id) {
        try {
            log.info("Getting member by ID: {}", id);
            MemberEntity entity = repository.findById(id).orElse(null);
            if (entity == null) throw new MembersException("Cadastro not found for ID: " + id);
            return new MemberDTO(entity);
        } catch (Exception e) {
            throw new MembersException("ID " + id + " not found");
        }
    }

    public MemberEntity getByCPF(String cpf) {
        try {
            log.info("Getting member by CPF: {}", cpf);
            MemberEntity entity = repository.findByCpf(CPFUtil.validateAndFormatCPF(cpf));
            if (!isNull(entity)) return entity;
            else return null;
        } catch (Exception e) {
            throw new MembersException("ID " + cpf + " not found");
        }
    }

    public void create(MemberEntity member) {
        try {
            log.info("Creating new member!");
            MemberEntity existMember = null;

            if(!isNull(member.getCpf())) {
                var cpf = CPFUtil.validateAndFormatCPF(member.getCpf());
                existMember = this.getByCPF(cpf);
            }

            if(isNull(existMember)) {
                member.setCpf(CPFUtil.validateAndFormatCPF(member.getCpf()));
                member.setRg(RGUtil.validateAndFormatRG(member.getRg()));
                repository.save(member);
            }
        } catch (Exception e) {
            throw new MembersException("Error to create new appointment", e);
        }
    }

    public MemberEntity updateById(Long id, MemberEntity member) {
        log.info("Updating user: {}", member.getCpf());
        try {
            MemberEntity originalMember = repository.findById(id)
                    .orElseThrow(() -> new MembersException("User not found for id " + id));

            member.setCpf(CPFUtil.validateAndFormatCPF(member.getCpf()));
            member.setRg(RGUtil.validateAndFormatRG(member.getRg()));

            MemberEntity updatedUser = new MemberEntity(member, originalMember);

            return repository.save(updatedUser);
        } catch (Exception e) {
            throw new UserException("Error updating user", e);
        }
    }

    public void delete(Long id) {
        try {
            log.info("Deleting member by ID: {}", id);
            if (!repository.existsById(id)) throw new RuntimeException("Not found with this ID: " + id);
            repository.deleteById(id);
        } catch (Exception e) {
            throw new MembersException("Error to delete appointment with ID: " + id, e);
        }
    }
}
