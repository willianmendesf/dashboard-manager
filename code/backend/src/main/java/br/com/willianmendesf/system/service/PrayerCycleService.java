package br.com.willianmendesf.system.service;

import br.com.willianmendesf.system.model.dto.PrayerCycleDTO;
import br.com.willianmendesf.system.model.dto.PrayerPersonDTO;
import br.com.willianmendesf.system.model.entity.PrayerCycle;
import br.com.willianmendesf.system.model.entity.PrayerPerson;
import br.com.willianmendesf.system.repository.PrayerCycleRepository;
import br.com.willianmendesf.system.repository.PrayerPersonRepository;
import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@AllArgsConstructor
public class PrayerCycleService {

    private final PrayerCycleRepository cycleRepository;
    private final PrayerPersonRepository personRepository;

    @Transactional
    public void saveCycleCompleted(Long intercessorId) {
        log.info("Saving completed cycle for intercessor: {}", intercessorId);
        PrayerPerson intercessor = personRepository.findById(intercessorId)
                .orElseThrow(() -> new RuntimeException("Intercessor not found: " + intercessorId));
        
        PrayerCycle cycle = new PrayerCycle();
        cycle.setIntercessor(intercessor);
        cycle.setCycleType(PrayerCycle.CycleType.COMPLETED);
        cycle.setCompletionDate(LocalDateTime.now());
        cycle.setPercentComplete(100.0);
        
        cycleRepository.save(cycle);
        log.info("Cycle completed saved for intercessor: {}", intercessorId);
    }

    @Transactional
    public void saveAnticipatedReset(Long intercessorId, String reason, Double percent) {
        log.info("Saving anticipated reset for intercessor: {} ({}%)", intercessorId, percent);
        PrayerPerson intercessor = personRepository.findById(intercessorId)
                .orElseThrow(() -> new RuntimeException("Intercessor not found: " + intercessorId));
        
        PrayerCycle cycle = new PrayerCycle();
        cycle.setIntercessor(intercessor);
        cycle.setCycleType(PrayerCycle.CycleType.ANTICIPATED);
        cycle.setCompletionDate(LocalDateTime.now());
        cycle.setPercentComplete(percent);
        cycle.setReason(reason);
        
        cycleRepository.save(cycle);
        log.info("Anticipated reset saved for intercessor: {}", intercessorId);
    }

    public List<PrayerCycleDTO> getCyclesByIntercessor(Long intercessorId) {
        log.info("Getting cycles for intercessor: {}", intercessorId);
        List<PrayerCycle> cycles = cycleRepository.findByIntercessorIdOrderByDateDesc(intercessorId);
        return cycles.stream().map(this::convertToDTO).collect(Collectors.toList());
    }

    private PrayerCycleDTO convertToDTO(PrayerCycle cycle) {
        PrayerCycleDTO dto = new PrayerCycleDTO();
        dto.setId(cycle.getId());
        dto.setCycleType(cycle.getCycleType());
        dto.setCompletionDate(cycle.getCompletionDate());
        dto.setPercentComplete(cycle.getPercentComplete());
        dto.setReason(cycle.getReason());
        dto.setCreatedAt(cycle.getCreatedAt());
        
        // Converter intercessor
        PrayerPerson intercessor = cycle.getIntercessor();
        PrayerPersonDTO intercessorDTO = new PrayerPersonDTO();
        intercessorDTO.setId(intercessor.getId());
        intercessorDTO.setNome(intercessor.getNome());
        intercessorDTO.setCelular(intercessor.getCelular());
        intercessorDTO.setTipo(intercessor.getTipo());
        intercessorDTO.setIsIntercessor(intercessor.getIsIntercessor());
        dto.setIntercessor(intercessorDTO);
        
        return dto;
    }
}

