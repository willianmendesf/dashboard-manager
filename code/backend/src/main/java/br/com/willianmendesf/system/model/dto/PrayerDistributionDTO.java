package br.com.willianmendesf.system.model.dto;

import br.com.willianmendesf.system.model.entity.PrayerDistribution;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class PrayerDistributionDTO {
    private Long id;
    private LocalDate distributionDate;
    private PrayerPersonDTO intercessor;
    private List<Map<String, Object>> distributedPersons;
    private Integer totalDistributed;
    private LocalDateTime sentAt;
    private PrayerDistribution.DistributionStatus status;
    private Long templateId;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}

