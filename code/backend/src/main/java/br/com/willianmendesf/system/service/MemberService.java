package br.com.willianmendesf.system.service;

import br.com.willianmendesf.system.exception.MembersException;
import br.com.willianmendesf.system.exception.UserException;
import br.com.willianmendesf.system.model.dto.MemberDTO;
import br.com.willianmendesf.system.model.dto.MemberSpouseDTO;
import br.com.willianmendesf.system.model.dto.UpdateMemberDTO;
import br.com.willianmendesf.system.model.entity.MemberEntity;
import br.com.willianmendesf.system.repository.MemberRepository;
import br.com.willianmendesf.system.service.utils.CPFUtil;
import br.com.willianmendesf.system.service.utils.RGUtil;
import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

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

    /**
     * Gets spouse information by CPF (returns only nomeCompleto and fotoUrl)
     * Used for relationship preview in member forms
     */
    public MemberSpouseDTO getSpouseByCpf(String cpf) {
        try {
            log.info("Getting spouse by CPF: {}", cpf);
            String formattedCpf = CPFUtil.validateAndFormatCPF(cpf);
            MemberEntity entity = repository.findByCpf(formattedCpf);
            
            if (entity == null) {
                return null;
            }
            
            MemberSpouseDTO spouse = new MemberSpouseDTO();
            spouse.setNomeCompleto(entity.getNome());
            spouse.setFotoUrl(entity.getFotoUrl());
            spouse.setCpf(entity.getCpf());
            spouse.setCelular(entity.getCelular());
            
            return spouse;
        } catch (Exception e) {
            log.error("Error getting spouse by CPF: {}", cpf, e);
            return null;
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

            if (member.getCpf() != null && !member.getCpf().trim().isEmpty()) {
                originalMember.setCpf(CPFUtil.validateAndFormatCPF(member.getCpf()));
            }

            if (member.getRg() != null && !member.getRg().trim().isEmpty()) {
                originalMember.setRg(RGUtil.validateAndFormatRG(member.getRg()));
            }

            if (member.getNome() != null && !member.getNome().trim().isEmpty()) originalMember.setNome(member.getNome());
            if (member.getConjugueCPF() != null && !member.getConjugueCPF().trim().isEmpty()) originalMember.setConjugueCPF(member.getConjugueCPF());
            if (member.getComungante() != null) originalMember.setComungante(member.getComungante());
            if (member.getIntercessor() != null) originalMember.setIntercessor(member.getIntercessor());
            if (member.getTipoCadastro() != null && !member.getTipoCadastro().trim().isEmpty()) originalMember.setTipoCadastro(member.getTipoCadastro());
            if (member.getNascimento() != null) originalMember.setNascimento(member.getNascimento());
            if (member.getIdade() != null) originalMember.setIdade(member.getIdade());
            if (member.getEstadoCivil() != null) originalMember.setEstadoCivil(member.getEstadoCivil());
            if (member.getCep() != null && !member.getCep().trim().isEmpty()) originalMember.setCep(member.getCep());
            if (member.getLogradouro() != null && !member.getLogradouro().trim().isEmpty()) originalMember.setLogradouro(member.getLogradouro());
            if (member.getNumero() != null && !member.getNumero().trim().isEmpty()) originalMember.setNumero(member.getNumero());
            if (member.getComplemento() != null && !member.getComplemento().trim().isEmpty()) originalMember.setComplemento(member.getComplemento());
            if (member.getBairro() != null && !member.getBairro().trim().isEmpty()) originalMember.setBairro(member.getBairro());
            if (member.getCidade() != null && !member.getCidade().trim().isEmpty()) originalMember.setCidade(member.getCidade());
            if (member.getEstado() != null && !member.getEstado().trim().isEmpty()) originalMember.setEstado(member.getEstado());
            if (member.getTelefone() != null && !member.getTelefone().trim().isEmpty()) originalMember.setTelefone(member.getTelefone());
            if (member.getComercial() != null && !member.getComercial().trim().isEmpty()) originalMember.setComercial(member.getComercial());
            if (member.getCelular() != null && !member.getCelular().trim().isEmpty()) originalMember.setCelular(member.getCelular());
            if (member.getContato() != null && !member.getContato().trim().isEmpty()) originalMember.setContato(member.getContato());
            if (member.getEmail() != null && !member.getEmail().trim().isEmpty()) originalMember.setEmail(member.getEmail());
            if (member.getGrupos() != null && !member.getGrupos().trim().isEmpty()) originalMember.setGrupos(member.getGrupos());
            if (member.getLgpd() != null) originalMember.setLgpd(member.getLgpd());
            if (member.getLgpdAceitoEm() != null) originalMember.setLgpdAceitoEm(member.getLgpdAceitoEm());
            if (member.getRede() != null && !member.getRede().trim().isEmpty()) originalMember.setRede(member.getRede());
            if (member.getFotoUrl() != null && !member.getFotoUrl().trim().isEmpty()) originalMember.setFotoUrl(member.getFotoUrl());

            return repository.save(originalMember);
        } catch (org.hibernate.StaleObjectStateException | jakarta.persistence.OptimisticLockException e) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Resource was updated by another transaction", e);
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

    /**
     * Busca um membro por CPF e retorna como DTO
     * Usado no portal público de atualização cadastral
     */
    public MemberDTO findMemberByCpf(String cpf) {
        try {
            log.info("Finding member by CPF for public portal: {}", cpf);
            String formattedCpf = CPFUtil.validateAndFormatCPF(cpf);
            MemberEntity entity = repository.findByCpf(formattedCpf);
            
            if (entity == null) {
                throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Membro não encontrado com o CPF informado");
            }
            
            return new MemberDTO(entity);
        } catch (ResponseStatusException e) {
            throw e;
        } catch (Exception e) {
            log.error("Error finding member by CPF: {}", cpf, e);
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Membro não encontrado com o CPF informado");
        }
    }

    /**
     * Atualiza um membro por CPF (portal público)
     * Regra "Write-Once": O CPF nunca pode ser alterado
     */
    public MemberDTO updateMemberByCpf(String cpf, UpdateMemberDTO dto) {
        try {
            log.info("Updating member by CPF for public portal: {}", cpf);
            String formattedCpf = CPFUtil.validateAndFormatCPF(cpf);
            MemberEntity existingMember = repository.findByCpf(formattedCpf);
            
            if (existingMember == null) {
                throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Membro não encontrado com o CPF informado");
            }

            // Atualizar apenas os campos permitidos (CPF nunca é alterado)
            if (dto.getNome() != null && !dto.getNome().trim().isEmpty()) {
                existingMember.setNome(dto.getNome());
            }
            
            if (dto.getEmail() != null && !dto.getEmail().trim().isEmpty()) {
                existingMember.setEmail(dto.getEmail());
            }
            
            if (dto.getTelefone() != null) {
                existingMember.setTelefone(dto.getTelefone());
            }
            
            if (dto.getComercial() != null) {
                existingMember.setComercial(dto.getComercial());
            }
            
            if (dto.getCelular() != null) {
                existingMember.setCelular(dto.getCelular());
            }
            
            if (dto.getCep() != null) {
                existingMember.setCep(dto.getCep());
            }
            
            if (dto.getLogradouro() != null) {
                existingMember.setLogradouro(dto.getLogradouro());
            }
            
            if (dto.getNumero() != null) {
                existingMember.setNumero(dto.getNumero());
            }
            
            if (dto.getComplemento() != null) {
                existingMember.setComplemento(dto.getComplemento());
            }
            
            if (dto.getBairro() != null) {
                existingMember.setBairro(dto.getBairro());
            }
            
            if (dto.getCidade() != null) {
                existingMember.setCidade(dto.getCidade());
            }
            
            if (dto.getEstado() != null) {
                existingMember.setEstado(dto.getEstado());
            }
            
            if (dto.getNascimento() != null) {
                existingMember.setNascimento(dto.getNascimento());
            }
            
            if (dto.getEstadoCivil() != null) {
                existingMember.setEstadoCivil(dto.getEstadoCivil());
            }
            
            if (dto.getRg() != null && !dto.getRg().trim().isEmpty()) {
                try {
                    existingMember.setRg(RGUtil.validateAndFormatRG(dto.getRg()));
                } catch (Exception e) {
                    log.warn("Invalid RG format, ignoring: {}", dto.getRg());
                }
            }
            
            if (dto.getTipoCadastro() != null) {
                existingMember.setTipoCadastro(dto.getTipoCadastro());
            }
            
            if (dto.getGrupos() != null) {
                existingMember.setGrupos(dto.getGrupos());
            }
            
            if (dto.getRede() != null) {
                existingMember.setRede(dto.getRede());
            }
            
            if (dto.getContato() != null) {
                existingMember.setContato(dto.getContato());
            }

            MemberEntity updatedMember = repository.save(existingMember);
            return new MemberDTO(updatedMember);
        } catch (ResponseStatusException e) {
            throw e;
        } catch (Exception e) {
            log.error("Error updating member by CPF: {}", cpf, e);
            throw new MembersException("Erro ao atualizar membro: " + e.getMessage(), e);
        }
    }
}
