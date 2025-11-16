package br.com.willianmendesf.system.service;

import br.com.willianmendesf.system.model.dto.PrayerDistributionDTO;
import br.com.willianmendesf.system.model.dto.PrayerPersonDTO;
import br.com.willianmendesf.system.model.entity.PrayerDistribution;
import br.com.willianmendesf.system.model.entity.PrayerPerson;
import br.com.willianmendesf.system.repository.PrayerDistributionRepository;
import br.com.willianmendesf.system.repository.PrayerPersonRepository;
import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
@AllArgsConstructor
public class PrayerHistoryService {

    private final PrayerDistributionRepository distributionRepository;
    private final PrayerPersonRepository personRepository;

    @Transactional
    public void saveDistribution(PrayerDistribution distribution) {
        log.info("Saving distribution for intercessor: {}", distribution.getIntercessor().getId());
        distributionRepository.save(distribution);
    }

    public Map<String, List<PrayerDistributionDTO>> readHistory(LocalDate startDate, LocalDate endDate) {
        log.info("Reading history from {} to {}", startDate, endDate);
        List<PrayerDistribution> distributions = distributionRepository.findByDistributionDateBetween(startDate, endDate);
        
        Map<String, List<PrayerDistributionDTO>> history = new HashMap<>();
        for (PrayerDistribution dist : distributions) {
            String dateKey = dist.getDistributionDate().toString();
            history.computeIfAbsent(dateKey, k -> new ArrayList<>()).add(convertToDTO(dist));
        }
        
        return history;
    }

    public Map<String, Set<String>> getHistorySets() {
        log.info("Building history sets for all intercessors");
        List<PrayerDistribution> allDistributions = distributionRepository.findAll();
        Map<String, Set<String>> historySets = new HashMap<>();
        
        for (PrayerDistribution dist : allDistributions) {
            String intercessorName = dist.getIntercessor().getNome();
            historySets.putIfAbsent(intercessorName, new HashSet<>());
            
            if (dist.getDistributedPersons() != null) {
                for (Map<String, Object> person : dist.getDistributedPersons()) {
                    String personName = (String) person.get("nome");
                    if (personName != null) {
                        historySets.get(intercessorName).add(personName);
                    }
                }
            }
        }
        
        return historySets;
    }

    @Transactional
    public boolean clearHistoryFor(Long intercessorId) {
        log.info("Clearing history for intercessor: {}", intercessorId);
        try {
            List<PrayerDistribution> distributions = distributionRepository.findByIntercessorId(intercessorId);
            distributionRepository.deleteAll(distributions);
            log.info("Cleared {} distributions for intercessor {}", distributions.size(), intercessorId);
            return true;
        } catch (Exception e) {
            log.error("Error clearing history for intercessor {}", intercessorId, e);
            return false;
        }
    }

    public boolean wasEverDistributed(Long personId, Long intercessorId) {
        Optional<PrayerPerson> personOpt = personRepository.findById(personId);
        if (personOpt.isEmpty()) {
            return false;
        }
        
        String personName = personOpt.get().getNome();
        List<PrayerDistribution> distributions = distributionRepository.findByIntercessorId(intercessorId);
        
        for (PrayerDistribution dist : distributions) {
            if (dist.getDistributedPersons() != null) {
                for (Map<String, Object> p : dist.getDistributedPersons()) {
                    if (personName.equals(p.get("nome"))) {
                        return true;
                    }
                }
            }
        }
        
        return false;
    }

    public int getDistributionCount(Long intercessorId) {
        List<PrayerDistribution> distributions = distributionRepository.findByIntercessorId(intercessorId);
        Set<String> uniquePersons = new HashSet<>();
        
        for (PrayerDistribution dist : distributions) {
            if (dist.getDistributedPersons() != null) {
                for (Map<String, Object> person : dist.getDistributedPersons()) {
                    String personName = (String) person.get("nome");
                    if (personName != null) {
                        uniquePersons.add(personName);
                    }
                }
            }
        }
        
        return uniquePersons.size();
    }

    public int getChildCount(Long intercessorId) {
        List<PrayerDistribution> distributions = distributionRepository.findByIntercessorId(intercessorId);
        int childCount = 0;
        
        for (PrayerDistribution dist : distributions) {
            if (dist.getDistributedPersons() != null) {
                for (Map<String, Object> person : dist.getDistributedPersons()) {
                    String tipo = (String) person.get("tipo");
                    if (tipo != null && (tipo.equalsIgnoreCase("CRIANCA") || tipo.equalsIgnoreCase("criança"))) {
                        childCount++;
                    }
                }
            }
        }
        
        return childCount;
    }

    private PrayerDistributionDTO convertToDTO(PrayerDistribution dist) {
        PrayerDistributionDTO dto = new PrayerDistributionDTO();
        dto.setId(dist.getId());
        dto.setDistributionDate(dist.getDistributionDate());
        dto.setDistributedPersons(dist.getDistributedPersons());
        dto.setTotalDistributed(dist.getTotalDistributed());
        dto.setSentAt(dist.getSentAt());
        dto.setStatus(dist.getStatus());
        dto.setTemplateId(dist.getTemplateId());
        dto.setCreatedAt(dist.getCreatedAt());
        dto.setUpdatedAt(dist.getUpdatedAt());
        
        // Converter intercessor
        PrayerPerson intercessor = dist.getIntercessor();
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

