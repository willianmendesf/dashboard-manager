package br.com.willianmendesf.system.model.dto;

import br.com.willianmendesf.system.model.entity.PrayerCycle;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class PrayerCycleDTO {
    private Long id;
    private PrayerPersonDTO intercessor;
    private PrayerCycle.CycleType cycleType;
    private LocalDateTime completionDate;
    private Double percentComplete;
    private String reason;
    private LocalDateTime createdAt;
}

