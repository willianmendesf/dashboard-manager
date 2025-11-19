package br.com.willianmendesf.system.model.dto;

import br.com.willianmendesf.system.model.entity.AttendanceEntity;
import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class AttendanceDTO {
    private Long id;
    private Long memberId;
    private Long eventId;
    
    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
    private LocalDateTime checkInTime;
    
    public AttendanceDTO(AttendanceEntity entity) {
        this.id = entity.getId();
        this.memberId = entity.getMember().getId();
        this.eventId = entity.getEvent().getId();
        this.checkInTime = entity.getCheckInTime();
    }
}

