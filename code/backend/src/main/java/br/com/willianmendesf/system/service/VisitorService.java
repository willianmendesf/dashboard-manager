package br.com.willianmendesf.system.service;

import br.com.willianmendesf.system.exception.MembersException;
import br.com.willianmendesf.system.model.dto.CreateVisitorDTO;
import br.com.willianmendesf.system.model.dto.UpdateVisitorDTO;
import br.com.willianmendesf.system.model.dto.VisitorDTO;
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
            entity.setProcuraIgreja(dto.getProcuraIgreja());
            entity.setEDeSP(dto.getEDeSP());
            
            // Se não é de SP, validar e salvar estado
            if (Boolean.FALSE.equals(dto.getEDeSP())) {
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
            
            if (dto.getProcuraIgreja() != null) {
                entity.setProcuraIgreja(dto.getProcuraIgreja());
            }
            
            // Sempre atualizar eDeSP e estado se fornecidos
            if (dto.getEDeSP() != null) {
                entity.setEDeSP(dto.getEDeSP());
                // Se não é de SP, validar e salvar estado
                if (Boolean.FALSE.equals(dto.getEDeSP())) {
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
            } else if (dto.getEstado() != null) {
                // Se eDeSP não foi alterado mas estado foi, atualizar apenas se não for SP
                if (Boolean.FALSE.equals(entity.getEDeSP())) {
                    if (!dto.getEstado().trim().isEmpty()) {
                        entity.setEstado(dto.getEstado().trim().toUpperCase());
                        log.info("Updating estado to: {}", entity.getEstado());
                    } else {
                        entity.setEstado(null);
                        log.info("Estado is empty, setting to null");
                    }
                }
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

