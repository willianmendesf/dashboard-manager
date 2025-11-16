package br.com.willianmendesf.system.service;

import br.com.willianmendesf.system.model.dto.MemberDTO;
import br.com.willianmendesf.system.model.dto.PrayerPersonDTO;
import br.com.willianmendesf.system.model.entity.MemberEntity;
import br.com.willianmendesf.system.model.entity.PrayerPerson;
import br.com.willianmendesf.system.repository.MemberRepository;
import br.com.willianmendesf.system.repository.PrayerPersonRepository;
import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Slf4j
@Service
@AllArgsConstructor
public class PrayerPersonService {

    private final PrayerPersonRepository personRepository;
    private final MemberRepository memberRepository;

    public List<PrayerPersonDTO> getAll() {
        log.info("Getting all prayer persons");
        return personRepository.findAll().stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    public PrayerPersonDTO getById(Long id) {
        log.info("Getting prayer person by ID: {}", id);
        PrayerPerson person = personRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Prayer person not found: " + id));
        return convertToDTO(person);
    }

    @Transactional
    public PrayerPersonDTO create(PrayerPersonDTO dto) {
        log.info("Creating new prayer person: {}", dto.getNome());
        PrayerPerson person = convertToEntity(dto);
        person = personRepository.save(person);
        return convertToDTO(person);
    }

    @Transactional
    public PrayerPersonDTO update(Long id, PrayerPersonDTO dto) {
        log.info("Updating prayer person: {}", id);
        PrayerPerson person = personRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Prayer person not found: " + id));
        
        person.setNome(dto.getNome());
        person.setCelular(dto.getCelular());
        person.setTipo(dto.getTipo());
        person.setIsIntercessor(dto.getIsIntercessor());
        person.setIsExternal(dto.getIsExternal());
        person.setMemberId(dto.getMemberId());
        person.setNomePai(dto.getNomePai());
        person.setTelefonePai(dto.getTelefonePai());
        person.setNomeMae(dto.getNomeMae());
        person.setTelefoneMae(dto.getTelefoneMae());
        person.setResponsaveis(dto.getResponsaveis());
        person.setActive(dto.getActive());
        
        person = personRepository.save(person);
        return convertToDTO(person);
    }

    @Transactional
    public void delete(Long id) {
        log.info("Deleting prayer person: {}", id);
        PrayerPerson person = personRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Prayer person not found: " + id));
        person.setActive(false);
        personRepository.save(person);
    }

    public List<PrayerPersonDTO> getIntercessors() {
        log.info("Getting all intercessors");
        return personRepository.findActiveIntercessors().stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    public List<PrayerPersonDTO> getCandidates() {
        log.info("Getting all candidates");
        return personRepository.findAllActive().stream()
                .filter(p -> Boolean.TRUE.equals(p.getActive()))
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    /**
     * Sincroniza membros com PrayerPerson
     * Cria ou atualiza PrayerPerson baseado nos membros selecionados
     * 
     * Regras:
     * - Se membro.intercessor = true → criar/atualizar PrayerPerson com isIntercessor = true
     * - Se membro.podeReceberOracao = true e não for intercessor → criar/atualizar PrayerPerson como candidato
     * - Determina tipo (CRIANCA/ADULTO) baseado na idade (< 18 = CRIANCA, >= 18 = ADULTO)
     * - Se já existir pelo memberId, atualiza; senão, cria novo
     */
    @Transactional
    public List<PrayerPersonDTO> syncFromMembers(List<Long> memberIds) {
        log.info("Syncing {} members to PrayerPerson", memberIds.size());
        List<PrayerPersonDTO> syncedPersons = new ArrayList<>();
        
        for (Long memberId : memberIds) {
            try {
                MemberEntity member = memberRepository.findById(memberId)
                        .orElseThrow(() -> new RuntimeException("Member not found: " + memberId));
                
                // Verificar se deve sincronizar este membro
                boolean shouldSync = false;
                boolean isIntercessor = Boolean.TRUE.equals(member.getIntercessor());
                boolean podeReceberOracao = Boolean.TRUE.equals(member.getPodeReceberOracao());
                
                if (isIntercessor || podeReceberOracao) {
                    shouldSync = true;
                } else {
                    log.debug("Member {} (ID: {}) skipped: neither intercessor nor podeReceberOracao", 
                            member.getNome(), memberId);
                    continue;
                }
                
                if (!shouldSync) {
                    continue;
                }
                
                // Buscar PrayerPerson existente por memberId
                Optional<PrayerPerson> existingPersonOpt = personRepository.findByMemberId(memberId);
                PrayerPerson person;
                
                if (existingPersonOpt.isPresent()) {
                    // Atualizar existente
                    person = existingPersonOpt.get();
                    log.debug("Updating existing PrayerPerson for member {} (ID: {})", 
                            member.getNome(), memberId);
                } else {
                    // Criar novo
                    person = new PrayerPerson();
                    person.setMemberId(memberId);
                    person.setIsExternal(false);
                    log.debug("Creating new PrayerPerson for member {} (ID: {})", 
                            member.getNome(), memberId);
                }
                
                // Atualizar/criar dados do PrayerPerson
                person.setNome(member.getNome());
                
                // Celular: priorizar celular, senão telefone
                if (member.getCelular() != null && !member.getCelular().trim().isEmpty()) {
                    person.setCelular(member.getCelular());
                } else if (member.getTelefone() != null && !member.getTelefone().trim().isEmpty()) {
                    person.setCelular(member.getTelefone());
                }
                
                // Determinar tipo (CRIANCA/ADULTO)
                if (Boolean.TRUE.equals(member.getChild())) {
                    person.setTipo(PrayerPerson.PersonType.CRIANCA);
                } else if (member.getIdade() != null) {
                    person.setTipo(member.getIdade() < 18 ? 
                            PrayerPerson.PersonType.CRIANCA : PrayerPerson.PersonType.ADULTO);
                } else if (member.getNascimento() != null) {
                    LocalDate hoje = LocalDate.now();
                    int idade = hoje.getYear() - member.getNascimento().getYear();
                    if (member.getNascimento().plusYears(idade).isAfter(hoje)) {
                        idade--;
                    }
                    person.setTipo(idade < 18 ? 
                            PrayerPerson.PersonType.CRIANCA : PrayerPerson.PersonType.ADULTO);
                } else {
                    // Default: ADULTO se não souber
                    person.setTipo(PrayerPerson.PersonType.ADULTO);
                }
                
                // Configurar isIntercessor baseado no membro
                person.setIsIntercessor(isIntercessor);
                
                // Se não for intercessor mas pode receber oração, manter como candidato ativo
                if (!isIntercessor && podeReceberOracao) {
                    person.setActive(true);
                } else if (isIntercessor) {
                    // Intercessor sempre ativo
                    person.setActive(true);
                } else {
                    // Se não pode receber oração e não é intercessor, desativar
                    person.setActive(false);
                }
                
                person = personRepository.save(person);
                syncedPersons.add(convertToDTO(person));
                
                log.info("Synced member {} (ID: {}) to PrayerPerson {} - Intercessor: {}, Tipo: {}", 
                        member.getNome(), memberId, person.getId(), isIntercessor, person.getTipo());
                        
            } catch (Exception e) {
                log.error("Error syncing member {}: {}", memberId, e.getMessage(), e);
                // Continuar com os próximos membros mesmo se um falhar
            }
        }
        
        log.info("Sync completed: {} PrayerPersons synced", syncedPersons.size());
        return syncedPersons;
    }

    private PrayerPersonDTO convertToDTO(PrayerPerson person) {
        PrayerPersonDTO dto = new PrayerPersonDTO();
        dto.setId(person.getId());
        dto.setNome(person.getNome());
        dto.setCelular(person.getCelular());
        dto.setTipo(person.getTipo());
        dto.setIsIntercessor(person.getIsIntercessor());
        dto.setIsExternal(person.getIsExternal());
        dto.setMemberId(person.getMemberId());
        dto.setNomePai(person.getNomePai());
        dto.setTelefonePai(person.getTelefonePai());
        dto.setNomeMae(person.getNomeMae());
        dto.setTelefoneMae(person.getTelefoneMae());
        dto.setResponsaveis(person.getResponsaveis());
        dto.setActive(person.getActive());
        dto.setCreatedAt(person.getCreatedAt());
        dto.setUpdatedAt(person.getUpdatedAt());
        
        // Buscar dados do membro se vinculado
        if (person.getMemberId() != null) {
            Optional<MemberEntity> memberOpt = memberRepository.findById(person.getMemberId());
            if (memberOpt.isPresent()) {
                dto.setMemberData(new MemberDTO(memberOpt.get()));
            }
        }
        
        return dto;
    }

    private PrayerPerson convertToEntity(PrayerPersonDTO dto) {
        PrayerPerson person = new PrayerPerson();
        person.setNome(dto.getNome());
        person.setCelular(dto.getCelular());
        person.setTipo(dto.getTipo());
        person.setIsIntercessor(dto.getIsIntercessor() != null ? dto.getIsIntercessor() : false);
        person.setIsExternal(dto.getIsExternal() != null ? dto.getIsExternal() : false);
        person.setMemberId(dto.getMemberId());
        person.setNomePai(dto.getNomePai());
        person.setTelefonePai(dto.getTelefonePai());
        person.setNomeMae(dto.getNomeMae());
        person.setTelefoneMae(dto.getTelefoneMae());
        person.setResponsaveis(dto.getResponsaveis());
        person.setActive(dto.getActive() != null ? dto.getActive() : true);
        return person;
    }
}

