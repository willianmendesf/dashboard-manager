package br.com.willianmendesf.system.model.dto;

import br.com.willianmendesf.system.model.entity.EventEntity;
import br.com.willianmendesf.system.model.enums.EventType;
import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class EventDTO {
    private Long id;
    
    @JsonFormat(pattern = "yyyy-MM-dd")
    private LocalDate date;
    
    @JsonFormat(pattern = "HH:mm")
    private LocalTime startTime;
    
    @JsonFormat(pattern = "HH:mm")
    private LocalTime endTime;
    
    private String name;
    private EventType type;
    
    public EventDTO(EventEntity entity) {
        this.id = entity.getId();
        this.date = entity.getDate();
        this.startTime = entity.getStartTime();
        this.endTime = entity.getEndTime();
        this.name = entity.getName();
        this.type = entity.getType();
    }
}

