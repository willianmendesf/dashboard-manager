package br.com.willianmendesf.system.service;

import br.com.willianmendesf.system.exception.MembersException;
import br.com.willianmendesf.system.exception.UserException;
import br.com.willianmendesf.system.model.dto.GroupEnrollmentDTO;
import br.com.willianmendesf.system.model.dto.MemberDTO;
import br.com.willianmendesf.system.model.dto.MemberSpouseDTO;
import br.com.willianmendesf.system.model.dto.UpdateMemberDTO;
import br.com.willianmendesf.system.model.entity.GroupEntity;
import br.com.willianmendesf.system.model.entity.MemberEntity;
import br.com.willianmendesf.system.repository.GroupEnrollmentRepository;
import br.com.willianmendesf.system.repository.GroupRepository;
import br.com.willianmendesf.system.repository.MemberRepository;
import br.com.willianmendesf.system.service.utils.PhoneUtil;
import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

import static java.util.Objects.isNull;

@Slf4j
@Service
@AllArgsConstructor
public class MemberService {

    private final MemberRepository repository;
    private final GroupRepository groupRepository;
    private final GroupEnrollmentRepository enrollmentRepository;

    public List<MemberDTO> getAll() {
        try {
            log.info("Getting all members from database");
            return repository.findAllWithGroups().stream()
                    .map(member -> {
                        List<GroupEnrollmentDTO> enrollments = enrollmentRepository.findByMemberId(member.getId())
                                .stream()
                                .map(GroupEnrollmentDTO::new)
                                .collect(Collectors.toList());
                        return new MemberDTO(member, enrollments);
                    })
                    .collect(java.util.stream.Collectors.toList());
        } catch (Exception e) {
            throw new MembersException("Error to return values" ,e);
        }
    }
    
    public List<MemberDTO> getAllByGroupId(Long groupId) {
        try {
            log.info("Getting all members by group ID: {}", groupId);
            return repository.findByGroupsId(groupId).stream()
                    .map(member -> {
                        List<GroupEnrollmentDTO> enrollments = enrollmentRepository.findByMemberId(member.getId())
                                .stream()
                                .map(GroupEnrollmentDTO::new)
                                .collect(Collectors.toList());
                        return new MemberDTO(member, enrollments);
                    })
                    .collect(java.util.stream.Collectors.toList());
        } catch (Exception e) {
            throw new MembersException("Error to return members by group", e);
        }
    }

    public MemberDTO getById(Long id) {
        try {
            log.info("Getting member by ID: {}", id);
            MemberEntity entity = repository.findByIdWithGroups(id)
                    .orElseThrow(() -> new MembersException("Cadastro not found for ID: " + id));
            List<GroupEnrollmentDTO> enrollments = enrollmentRepository.findByMemberId(id)
                    .stream()
                    .map(GroupEnrollmentDTO::new)
                    .collect(Collectors.toList());
            return new MemberDTO(entity, enrollments);
        } catch (MembersException e) {
            throw e;
        } catch (Exception e) {
            throw new MembersException("ID " + id + " not found", e);
        }
    }

    /**
     * Gets spouse information by telefone (returns only nomeCompleto, fotoUrl and celular)
     * Used for relationship preview in member forms
     */
    public MemberSpouseDTO getSpouseByTelefone(String telefone) {
        try {
            log.info("Getting spouse by telefone: {}", telefone);
            // Sanitiza e valida o telefone
            String sanitizedPhone = PhoneUtil.sanitizeAndValidate(telefone);
            if (sanitizedPhone == null) {
                log.warn("Invalid phone format for spouse lookup: {}", telefone);
                return null;
            }
            
            MemberEntity entity = repository.findByConjugueTelefone(sanitizedPhone);
            
            if (entity == null) {
                return null;
            }
            
            MemberSpouseDTO spouse = new MemberSpouseDTO();
            spouse.setNomeCompleto(entity.getNome());
            spouse.setFotoUrl(entity.getFotoUrl());
            spouse.setCelular(entity.getCelular());
            
            return spouse;
        } catch (Exception e) {
            log.error("Error getting spouse by telefone: {}", telefone, e);
            return null;
        }
    }

    public void create(MemberEntity member) {
        try {
            log.info("Creating new member!");
            repository.save(member);
        } catch (Exception e) {
            throw new MembersException("Error to create new appointment", e);
        }
    }

    public MemberEntity updateById(Long id, MemberEntity member) {
        log.info("Updating user with ID: {}", id);
        try {
            MemberEntity originalMember = repository.findByIdWithGroups(id)
                    .orElseThrow(() -> new MembersException("User not found for id " + id));

            if (member.getNome() == null || member.getNome().trim().isEmpty()) {
                throw new MembersException("Nome é obrigatório");
            }
            originalMember.setNome(member.getNome().trim());

            if (member.getConjugueTelefone() != null && !member.getConjugueTelefone().trim().isEmpty()) {
                originalMember.setConjugueTelefone(member.getConjugueTelefone());
            }
            originalMember.setComungante(member.getComungante());
            originalMember.setIntercessor(member.getIntercessor());
            if (member.getChild() != null) originalMember.setChild(member.getChild());
            if (member.getTipoCadastro() != null && !member.getTipoCadastro().trim().isEmpty()) {
                originalMember.setTipoCadastro(member.getTipoCadastro().trim());
            } else {
                originalMember.setTipoCadastro(null);
            }
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
            if (member.getEmail() != null && !member.getEmail().trim().isEmpty()) originalMember.setEmail(member.getEmail());
            originalMember.setLgpd(member.getLgpd());
            originalMember.setLgpdAceitoEm(member.getLgpdAceitoEm());
            if (member.getFotoUrl() != null && !member.getFotoUrl().trim().isEmpty()) originalMember.setFotoUrl(member.getFotoUrl());
            
            if (member.getGroups() != null) {
                Set<GroupEntity> newGroupsSet = new HashSet<>();
                if (!member.getGroups().isEmpty()) {
                    var groupIds = member.getGroups().stream()
                        .map(g -> g != null ? g.getId() : null)
                        .filter(groupId -> groupId != null)
                        .distinct()
                        .toList();
                    if (!groupIds.isEmpty()) {
                        var groups = groupRepository.findAllById(groupIds);
                        for (GroupEntity group : groups) {
                            newGroupsSet.add(group);
                        }
                    }
                }
                originalMember.setGroups(newGroupsSet);
            }

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
     * Busca um membro por telefone e retorna como DTO
     * Usado no portal público após validação OTP
     */
    public MemberDTO findMemberByPhone(String phone) {
        try {
            log.info("Finding member by phone for public portal: {}", phone);
            // Sanitiza e valida o telefone
            String sanitizedPhone = br.com.willianmendesf.system.service.utils.PhoneUtil.sanitizeAndValidate(phone);
            if (sanitizedPhone == null) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Telefone inválido");
            }
            
            MemberEntity entity = repository.findByTelefoneOrCelular(sanitizedPhone);
            
            if (entity == null) {
                throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Membro não encontrado com o telefone informado");
            }
            
            List<GroupEnrollmentDTO> enrollments = enrollmentRepository.findByMemberId(entity.getId())
                    .stream()
                    .map(GroupEnrollmentDTO::new)
                    .collect(Collectors.toList());
            return new MemberDTO(entity, enrollments);
        } catch (ResponseStatusException e) {
            throw e;
        } catch (Exception e) {
            log.error("Error finding member by phone: {}", phone, e);
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Membro não encontrado com o telefone informado");
        }
    }

    /**
     * Atualiza um membro por telefone (portal público)
     */
    public MemberDTO updateMemberByTelefone(String telefone, UpdateMemberDTO dto) {
        try {
            log.info("Updating member by telefone for public portal: {}", telefone);
            // Sanitiza e valida o telefone
            String sanitizedPhone = PhoneUtil.sanitizeAndValidate(telefone);
            if (sanitizedPhone == null) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Telefone inválido");
            }
            
            MemberEntity existingMember = repository.findByTelefoneOrCelular(sanitizedPhone);
            
            if (existingMember == null) {
                throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Membro não encontrado com o telefone informado");
            }

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
            
            if (dto.getIdade() != null) {
                existingMember.setIdade(dto.getIdade());
            } else if (dto.getNascimento() != null) {
                LocalDate hoje = LocalDate.now();
                int idade = hoje.getYear() - dto.getNascimento().getYear();
                if (dto.getNascimento().plusYears(idade).isAfter(hoje)) {
                    idade--;
                }
                existingMember.setIdade(idade);
            }
            
            if (dto.getEstadoCivil() != null) {
                existingMember.setEstadoCivil(dto.getEstadoCivil());
            }
            
            if (dto.getConjugueTelefone() != null && !dto.getConjugueTelefone().trim().isEmpty()) {
                existingMember.setConjugueTelefone(dto.getConjugueTelefone());
            }
            
            if (dto.getChild() != null) {
                existingMember.setChild(dto.getChild());
            }
            
            if (dto.getTipoCadastro() != null) {
                existingMember.setTipoCadastro(dto.getTipoCadastro());
            }

            if (dto.getGroupIds() != null) {
                Set<GroupEntity> newGroupsSet = new HashSet<>();
                for (Long groupId : dto.getGroupIds()) {
                    groupRepository.findById(groupId).ifPresent(newGroupsSet::add);
                }
                existingMember.setGroups(newGroupsSet);
            }

            MemberEntity updatedMember = repository.save(existingMember);
            return new MemberDTO(updatedMember);
        } catch (ResponseStatusException e) {
            throw e;
        } catch (Exception e) {
            log.error("Error updating member by telefone: {}", telefone, e);
            throw new MembersException("Erro ao atualizar membro: " + e.getMessage(), e);
        }
    }
}
