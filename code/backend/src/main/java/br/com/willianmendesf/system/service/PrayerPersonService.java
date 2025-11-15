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

