package br.com.willianmendesf.system.service;

import br.com.willianmendesf.system.exception.MembersException;
import br.com.willianmendesf.system.model.dto.AccompanyingVisitorDTO;
import br.com.willianmendesf.system.model.dto.CreateVisitorDTO;
import br.com.willianmendesf.system.model.dto.UpdateVisitorDTO;
import br.com.willianmendesf.system.model.dto.VisitorDTO;
import br.com.willianmendesf.system.model.dto.VisitorGroupRequestDTO;
import br.com.willianmendesf.system.model.dto.VisitorStatsDTO;
import br.com.willianmendesf.system.model.entity.VisitorEntity;
import br.com.willianmendesf.system.repository.VisitorRepository;
import br.com.willianmendesf.system.service.storage.StorageService;
import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@AllArgsConstructor
public class VisitorService {

    private final VisitorRepository repository;
    private final StorageService storageService;

    @Transactional
    public VisitorDTO create(CreateVisitorDTO dto) {
        try {
            log.info("Creating visitor: {}", dto.getNomeCompleto());
            log.info("Visitor data - eDeSP: {}, estado: {}", dto.getEDeSP(), dto.getEstado());
            
            if (dto.getNomeCompleto() == null || dto.getNomeCompleto().trim().isEmpty()) {
                throw new MembersException("Nome completo é obrigatório");
            }
            
            VisitorEntity entity = new VisitorEntity();
            entity.setNomeCompleto(dto.getNomeCompleto().trim());
            entity.setDataVisita(dto.getDataVisita() != null ? dto.getDataVisita() : LocalDate.now());
            entity.setTelefone(dto.getTelefone());
            entity.setJaFrequentaIgreja(dto.getJaFrequentaIgreja());
            entity.setNomeIgreja(dto.getNomeIgreja());
            entity.setProcuraIgreja(dto.getProcuraIgreja());
            
            // SEMPRE salvar eDeSP (mesmo se null, usar default true)
            Boolean eDeSPValue = dto.getEDeSP() != null ? dto.getEDeSP() : true;
            entity.setEDeSP(eDeSPValue);
            log.info("Setting eDeSP to: {}", eDeSPValue);
            
            // Se não é de SP, validar e salvar estado
            if (Boolean.FALSE.equals(eDeSPValue)) {
                if (dto.getEstado() != null && !dto.getEstado().trim().isEmpty()) {
                    entity.setEstado(dto.getEstado().trim().toUpperCase());
                    log.info("Setting estado to: {}", entity.getEstado());
                } else {
                    entity.setEstado(null);
                    log.info("Estado is null or empty, setting to null");
                }
            } else {
                // Se for SP, sempre limpar estado
                entity.setEstado(null);
                log.info("eDeSP is true, clearing estado");
            }
            
            VisitorEntity saved = repository.save(entity);
            log.info("Visitor created with ID: {}, eDeSP: {}, estado: {}", saved.getId(), saved.getEDeSP(), saved.getEstado());
            
            VisitorDTO result = new VisitorDTO(saved);
            log.info("Returning VisitorDTO - eDeSP: {}, estado: {}", result.getEDeSP(), result.getEstado());
            return result;
        } catch (MembersException e) {
            throw e;
        } catch (Exception e) {
            log.error("Error creating visitor", e);
            throw new MembersException("Erro ao criar visitante: " + e.getMessage(), e);
        }
    }

    @Transactional
    public VisitorDTO createGroup(VisitorGroupRequestDTO dto) {
        try {
            log.info("Creating visitor group with main visitor: {}", dto.getMainVisitor() != null ? dto.getMainVisitor().getNomeCompleto() : "null");
            
            if (dto.getMainVisitor() == null) {
                throw new MembersException("Visitante principal é obrigatório");
            }
            
            // Passo 1: Salvar o visitante principal
            VisitorDTO mainVisitorDTO = create(dto.getMainVisitor());
            VisitorEntity mainVisitorEntity = repository.findById(mainVisitorDTO.getId())
                    .orElseThrow(() -> new MembersException("Erro ao recuperar visitante principal salvo"));
            
            log.info("Main visitor created with ID: {}", mainVisitorEntity.getId());
            
            // Passo 2: Salvar os acompanhantes
            if (dto.getAccompanyingVisitors() != null && !dto.getAccompanyingVisitors().isEmpty()) {
                for (AccompanyingVisitorDTO accompanyingDTO : dto.getAccompanyingVisitors()) {
                    if (accompanyingDTO.getNomeCompleto() == null || accompanyingDTO.getNomeCompleto().trim().isEmpty()) {
                        log.warn("Skipping accompanying visitor with empty name");
                        continue;
                    }
                    
                    VisitorEntity accompanyingEntity = new VisitorEntity();
                    accompanyingEntity.setNomeCompleto(accompanyingDTO.getNomeCompleto().trim());
                    accompanyingEntity.setAge(accompanyingDTO.getAge());
                    accompanyingEntity.setDataVisita(mainVisitorEntity.getDataVisita()); // Copiar data do principal
                    accompanyingEntity.setMainVisitor(mainVisitorEntity);
                    accompanyingEntity.setRelationship(accompanyingDTO.getRelationship());
                    
                    // Usar dados do DTO se fornecidos, caso contrário copiar do principal
                    accompanyingEntity.setTelefone(accompanyingDTO.getTelefone() != null && !accompanyingDTO.getTelefone().trim().isEmpty() 
                        ? accompanyingDTO.getTelefone().trim() 
                        : mainVisitorEntity.getTelefone());
                    accompanyingEntity.setJaFrequentaIgreja(accompanyingDTO.getJaFrequentaIgreja() != null && !accompanyingDTO.getJaFrequentaIgreja().trim().isEmpty() 
                        ? accompanyingDTO.getJaFrequentaIgreja() 
                        : mainVisitorEntity.getJaFrequentaIgreja());
                    accompanyingEntity.setNomeIgreja(accompanyingDTO.getNomeIgreja() != null && !accompanyingDTO.getNomeIgreja().trim().isEmpty() 
                        ? accompanyingDTO.getNomeIgreja().trim() 
                        : mainVisitorEntity.getNomeIgreja());
                    accompanyingEntity.setProcuraIgreja(accompanyingDTO.getProcuraIgreja() != null && !accompanyingDTO.getProcuraIgreja().trim().isEmpty() 
                        ? accompanyingDTO.getProcuraIgreja() 
                        : mainVisitorEntity.getProcuraIgreja());
                    
                    // Para eDeSP e estado, usar do DTO se fornecido, senão copiar do principal
                    Boolean accompanyingEDeSP = accompanyingDTO.getEDeSP() != null 
                        ? accompanyingDTO.getEDeSP() 
                        : mainVisitorEntity.getEDeSP();
                    accompanyingEntity.setEDeSP(accompanyingEDeSP);
                    
                    if (Boolean.FALSE.equals(accompanyingEDeSP)) {
                        // Se não é de SP, usar estado do DTO ou do principal
                        String accompanyingEstado = accompanyingDTO.getEstado() != null && !accompanyingDTO.getEstado().trim().isEmpty() 
                            ? accompanyingDTO.getEstado().trim().toUpperCase() 
                            : (mainVisitorEntity.getEstado() != null ? mainVisitorEntity.getEstado() : null);
                        accompanyingEntity.setEstado(accompanyingEstado);
                    } else {
                        // Se for SP, sempre limpar estado
                        accompanyingEntity.setEstado(null);
                    }
                    
                    VisitorEntity savedAccompanying = repository.save(accompanyingEntity);
                    log.info("Accompanying visitor created with ID: {}, name: {}, relationship: {}", 
                            savedAccompanying.getId(), savedAccompanying.getNomeCompleto(), savedAccompanying.getRelationship());
                }
            }
            
            log.info("Visitor group created successfully. Main visitor ID: {}", mainVisitorEntity.getId());
            return mainVisitorDTO;
        } catch (MembersException e) {
            throw e;
        } catch (Exception e) {
            log.error("Error creating visitor group", e);
            throw new MembersException("Erro ao criar grupo de visitantes: " + e.getMessage(), e);
        }
    }

    public List<VisitorDTO> getAll() {
        try {
            log.info("Getting all visitors");
            return repository.findAll().stream()
                    .map(VisitorDTO::new)
                    .collect(Collectors.toList());
        } catch (Exception e) {
            log.error("Error getting all visitors", e);
            throw new MembersException("Erro ao buscar visitantes", e);
        }
    }

    public VisitorDTO getById(Long id) {
        try {
            log.info("Getting visitor by ID: {}", id);
            VisitorEntity entity = repository.findById(id)
                    .orElseThrow(() -> new MembersException("Visitante não encontrado com ID: " + id));
            return new VisitorDTO(entity);
        } catch (MembersException e) {
            throw e;
        } catch (Exception e) {
            log.error("Error getting visitor by ID: {}", id, e);
            throw new MembersException("Erro ao buscar visitante", e);
        }
    }

    @Transactional
    public VisitorDTO update(Long id, UpdateVisitorDTO dto) {
        try {
            log.info("Updating visitor with ID: {}", id);
            log.info("Update data - eDeSP: {}, estado: {}", dto.getEDeSP(), dto.getEstado());
            
            VisitorEntity entity = repository.findById(id)
                    .orElseThrow(() -> new MembersException("Visitante não encontrado com ID: " + id));
            
            if (dto.getNomeCompleto() != null && !dto.getNomeCompleto().trim().isEmpty()) {
                entity.setNomeCompleto(dto.getNomeCompleto().trim());
            }
            
            if (dto.getDataVisita() != null) {
                entity.setDataVisita(dto.getDataVisita());
            }
            
            if (dto.getTelefone() != null) {
                entity.setTelefone(dto.getTelefone());
            }
            
            if (dto.getJaFrequentaIgreja() != null) {
                entity.setJaFrequentaIgreja(dto.getJaFrequentaIgreja());
            }
            
            if (dto.getNomeIgreja() != null) {
                entity.setNomeIgreja(dto.getNomeIgreja().trim());
            } else {
                entity.setNomeIgreja(null);
            }
            
            if (dto.getProcuraIgreja() != null) {
                entity.setProcuraIgreja(dto.getProcuraIgreja());
            }
            
            // SEMPRE atualizar eDeSP e estado (mesmo se null, usar default true)
            // Isso permite limpar os campos se necessário
            Boolean eDeSPValue = dto.getEDeSP() != null ? dto.getEDeSP() : true;
            entity.setEDeSP(eDeSPValue);
            log.info("Setting eDeSP to: {}", eDeSPValue);
            
            // Se não é de SP, validar e salvar estado
            if (Boolean.FALSE.equals(eDeSPValue)) {
                if (dto.getEstado() != null && !dto.getEstado().trim().isEmpty()) {
                    entity.setEstado(dto.getEstado().trim().toUpperCase());
                    log.info("Setting estado to: {}", entity.getEstado());
                } else {
                    entity.setEstado(null);
                    log.info("Estado is null or empty, setting to null");
                }
            } else {
                // Se for SP, sempre limpar estado
                entity.setEstado(null);
                log.info("eDeSP is true, clearing estado");
            }
            
            VisitorEntity saved = repository.save(entity);
            log.info("Visitor updated with ID: {}, eDeSP: {}, estado: {}", saved.getId(), saved.getEDeSP(), saved.getEstado());
            
            VisitorDTO result = new VisitorDTO(saved);
            log.info("Returning VisitorDTO - eDeSP: {}, estado: {}", result.getEDeSP(), result.getEstado());
            return result;
        } catch (MembersException e) {
            throw e;
        } catch (Exception e) {
            log.error("Error updating visitor with ID: {}", id, e);
            throw new MembersException("Erro ao atualizar visitante: " + e.getMessage(), e);
        }
    }

    @Transactional
    public void delete(Long id) {
        try {
            log.info("Deleting visitor with ID: {}", id);
            VisitorEntity entity = repository.findById(id)
                    .orElseThrow(() -> new MembersException("Visitante não encontrado com ID: " + id));
            
            // Deletar foto se existir
            if (entity.getFotoUrl() != null && !entity.getFotoUrl().isEmpty()) {
                storageService.deleteFile(entity.getFotoUrl());
            }
            
            repository.deleteById(id);
            log.info("Visitor deleted with ID: {}", id);
        } catch (MembersException e) {
            throw e;
        } catch (Exception e) {
            log.error("Error deleting visitor with ID: {}", id, e);
            throw new MembersException("Erro ao deletar visitante: " + e.getMessage(), e);
        }
    }

    public List<VisitorDTO> getByDate(LocalDate date) {
        try {
            log.info("Getting visitors by date: {}", date);
            return repository.findByDataVisita(date).stream()
                    .map(VisitorDTO::new)
                    .collect(Collectors.toList());
        } catch (Exception e) {
            log.error("Error getting visitors by date: {}", date, e);
            throw new MembersException("Erro ao buscar visitantes por data", e);
        }
    }

    public List<VisitorDTO> getByDateRange(LocalDate start, LocalDate end) {
        try {
            log.info("Getting visitors by date range: {} to {}", start, end);
            return repository.findByDataVisitaBetween(start, end).stream()
                    .map(VisitorDTO::new)
                    .collect(Collectors.toList());
        } catch (Exception e) {
            log.error("Error getting visitors by date range", e);
            throw new MembersException("Erro ao buscar visitantes por período", e);
        }
    }

    public List<VisitorDTO> searchByName(String nome) {
        try {
            log.info("Searching visitors by name: {}", nome);
            if (nome == null || nome.trim().isEmpty()) {
                return getAll();
            }
            return repository.findByNomeCompletoContainingIgnoreCase(nome.trim()).stream()
                    .map(VisitorDTO::new)
                    .collect(Collectors.toList());
        } catch (Exception e) {
            log.error("Error searching visitors by name: {}", nome, e);
            throw new MembersException("Erro ao buscar visitantes por nome", e);
        }
    }

    public List<VisitorStatsDTO> getSundayVisitorsStats() {
        try {
            log.info("Getting Sunday visitors statistics");
            
            // Buscar todas as visitas
            List<VisitorEntity> allVisitors = repository.findAll();
            log.info("Total visitors found: {}", allVisitors.size());
            
            // Filtrar apenas datas que são domingos e agrupar por data
            List<VisitorStatsDTO> stats = allVisitors.stream()
                    .filter(v -> {
                        if (v.getDataVisita() == null) {
                            return false;
                        }
                        boolean isSunday = v.getDataVisita().getDayOfWeek() == DayOfWeek.SUNDAY;
                        if (isSunday) {
                            log.debug("Found Sunday visitor: {} on {}", v.getNomeCompleto(), v.getDataVisita());
                        }
                        return isSunday;
                    })
                    .collect(Collectors.groupingBy(
                            VisitorEntity::getDataVisita,
                            Collectors.counting()
                    ))
                    .entrySet().stream()
                    .map(entry -> {
                        VisitorStatsDTO stat = new VisitorStatsDTO(entry.getKey(), entry.getValue());
                        log.debug("Sunday stat: {} - {} visitors", stat.getData(), stat.getQuantidade());
                        return stat;
                    })
                    .sorted((a, b) -> a.getData().compareTo(b.getData())) // Ordenar por data (mais antiga primeiro)
                    .collect(Collectors.toList());
            
            log.info("Found {} Sundays with visitors", stats.size());
            if (stats.isEmpty()) {
                log.warn("No Sunday visitors found. Make sure visitors have dataVisita set to a Sunday.");
            }
            return stats;
        } catch (Exception e) {
            log.error("Error getting Sunday visitors statistics", e);
            throw new MembersException("Erro ao buscar estatísticas de domingos", e);
        }
    }

    public List<VisitorStatsDTO> getVisitorStatsByDateRange(LocalDate startDate, LocalDate endDate) {
        try {
            LocalDate actualStartDate = startDate;
            LocalDate actualEndDate = endDate;
            
            // Se ambos forem null, calcular últimos 15 dias a partir de hoje
            if (actualStartDate == null && actualEndDate == null) {
                actualEndDate = LocalDate.now();
                actualStartDate = actualEndDate.minusDays(14); // 15 dias incluindo hoje
                log.info("No date range provided, using last 15 days: {} to {}", actualStartDate, actualEndDate);
            } else if (actualStartDate == null) {
                // Se só endDate fornecido, usar últimos 15 dias a partir de endDate
                actualStartDate = actualEndDate.minusDays(14);
                log.info("Only endDate provided, using last 15 days from endDate: {} to {}", actualStartDate, actualEndDate);
            } else if (actualEndDate == null) {
                // Se só startDate fornecido, usar até hoje
                actualEndDate = LocalDate.now();
                log.info("Only startDate provided, using from startDate to today: {} to {}", actualStartDate, actualEndDate);
            }
            
            // Validar que startDate <= endDate
            if (actualStartDate.isAfter(actualEndDate)) {
                throw new MembersException("Data de início não pode ser posterior à data de fim");
            }
            
            log.info("Getting visitor statistics from {} to {}", actualStartDate, actualEndDate);
            
            // Buscar visitantes no intervalo
            List<VisitorEntity> visitorsInRange = repository.findByDataVisitaBetween(actualStartDate, actualEndDate);
            log.info("Found {} visitors in date range", visitorsInRange.size());
            
            // Agrupar por dataVisita e contar (apenas datas que têm visitantes)
            List<VisitorStatsDTO> stats = visitorsInRange.stream()
                    .filter(v -> v.getDataVisita() != null)
                    .collect(Collectors.groupingBy(
                            VisitorEntity::getDataVisita,
                            Collectors.counting()
                    ))
                    .entrySet().stream()
                    .map(entry -> {
                        VisitorStatsDTO stat = new VisitorStatsDTO(entry.getKey(), entry.getValue());
                        log.debug("Stat: {} - {} visitors", stat.getData(), stat.getQuantidade());
                        return stat;
                    })
                    .sorted((a, b) -> a.getData().compareTo(b.getData())) // Ordenar por data (mais antiga primeiro)
                    .collect(Collectors.toList());
            
            log.info("Found {} dates with visitors in range", stats.size());
            return stats;
        } catch (MembersException e) {
            throw e;
        } catch (Exception e) {
            log.error("Error getting visitor statistics by date range", e);
            throw new MembersException("Erro ao buscar estatísticas de visitantes por intervalo de datas", e);
        }
    }

    @Transactional
    public VisitorDTO uploadPhoto(Long id, MultipartFile file) {
        try {
            log.info("Uploading photo for visitor ID: {}", id);
            
            if (file == null || file.isEmpty()) {
                throw new IllegalArgumentException("Arquivo não pode ser vazio");
            }
            
            if (!storageService.isValidImageFile(file)) {
                throw new IllegalArgumentException("Arquivo inválido. Apenas JPEG, PNG e GIF são permitidos.");
            }
            
            VisitorEntity entity = repository.findById(id)
                    .orElseThrow(() -> new MembersException("Visitante não encontrado com ID: " + id));
            
            // Deletar foto antiga se existir
            if (entity.getFotoUrl() != null && !entity.getFotoUrl().isEmpty()) {
                storageService.deleteFile(entity.getFotoUrl());
            }
            
            // Upload da nova foto
            String fotoUrl = storageService.uploadFile(
                    file,
                    "profiles",
                    "visitor",
                    entity.getId().toString()
            );
            
            entity.setFotoUrl(fotoUrl);
            VisitorEntity saved = repository.save(entity);
            
            log.info("Photo uploaded successfully for visitor ID: {}", id);
            return new VisitorDTO(saved);
        } catch (MembersException | IllegalArgumentException e) {
            throw e;
        } catch (Exception e) {
            log.error("Error uploading photo for visitor ID: {}", id, e);
            throw new MembersException("Erro ao fazer upload da foto: " + e.getMessage(), e);
        }
    }
}

