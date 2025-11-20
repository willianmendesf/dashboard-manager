package br.com.willianmendesf.system.service;

import br.com.willianmendesf.system.exception.MembersException;
import br.com.willianmendesf.system.model.dto.EventDTO;
import br.com.willianmendesf.system.model.entity.EventEntity;
import br.com.willianmendesf.system.model.enums.EventType;
import br.com.willianmendesf.system.repository.EventRepository;
import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@AllArgsConstructor
public class EventService {

    private final EventRepository repository;

    @Transactional
    public List<EventDTO> getAll(LocalDate date) {
        try {
            log.info("Getting events - date filter: {}", date);
            List<EventEntity> events;
            LocalDate targetDate = date != null ? date : LocalDate.now();
            
            // Sempre busca eventos para a data especificada (ou hoje se não especificada)
            events = repository.findByDate(targetDate);
            log.info("Found {} events for date: {}", events.size(), targetDate);
            
            // Se não houver eventos para a data, criar evento padrão
            if (events.isEmpty()) {
                log.info("No events found for date {}. Creating default event 'Culto'.", targetDate);
                try {
                    EventEntity defaultEvent = createDefaultEvent(targetDate);
                    events = List.of(defaultEvent);
                    log.info("Default event created and added to list. Event ID: {}", defaultEvent.getId());
                } catch (Exception e) {
                    log.error("Failed to create default event for date: {}", targetDate, e);
                    // Se falhar ao criar, retorna lista vazia ao invés de lançar exceção
                    // Isso permite que a tela continue funcionando mesmo se houver problema na criação
                    return List.of();
                }
            }
            
            List<EventDTO> result = events.stream()
                    .map(EventDTO::new)
                    .collect(Collectors.toList());
            log.info("Returning {} events as DTOs", result.size());
            return result;
        } catch (Exception e) {
            log.error("Error getting events", e);
            throw new MembersException("Erro ao buscar eventos", e);
        }
    }
    
    @Transactional
    private EventEntity createDefaultEvent(LocalDate date) {
        try {
            log.info("Creating default event 'Culto' for date: {}", date);
            EventEntity defaultEvent = new EventEntity();
            defaultEvent.setDate(date);
            defaultEvent.setName("Culto");
            defaultEvent.setStartTime(LocalTime.of(9, 30));
            defaultEvent.setEndTime(LocalTime.of(12, 30));
            defaultEvent.setType(EventType.WORSHIP_SERVICE);
            EventEntity saved = repository.save(defaultEvent);
            log.info("Default event created successfully with ID: {}", saved.getId());
            return saved;
        } catch (Exception e) {
            log.error("Error creating default event for date: {}", date, e);
            throw new MembersException("Erro ao criar evento padrão: " + e.getMessage(), e);
        }
    }

    public EventDTO getById(Long id) {
        try {
            log.info("Getting event by ID: {}", id);
            EventEntity entity = repository.findById(id)
                    .orElseThrow(() -> new MembersException("Evento não encontrado para ID: " + id));
            return new EventDTO(entity);
        } catch (MembersException e) {
            throw e;
        } catch (Exception e) {
            log.error("Error getting event by ID: {}", id, e);
            throw new MembersException("Erro ao buscar evento", e);
        }
    }

    @Transactional
    public EventDTO create(EventDTO dto) {
        try {
            log.info("Creating event: {}", dto.getName());
            
            EventEntity entity = new EventEntity();
            entity.setDate(dto.getDate() != null ? dto.getDate() : LocalDate.now());
            entity.setStartTime(dto.getStartTime() != null ? dto.getStartTime() : LocalTime.of(9, 30));
            entity.setEndTime(dto.getEndTime() != null ? dto.getEndTime() : LocalTime.of(12, 30));
            entity.setName(dto.getName() != null && !dto.getName().trim().isEmpty() 
                    ? dto.getName().trim() : "Culto");
            entity.setType(dto.getType() != null ? dto.getType() : EventType.WORSHIP_SERVICE);
            
            EventEntity saved = repository.save(entity);
            log.info("Event created with ID: {}", saved.getId());
            return new EventDTO(saved);
        } catch (Exception e) {
            log.error("Error creating event", e);
            throw new MembersException("Erro ao criar evento: " + e.getMessage(), e);
        }
    }
}

