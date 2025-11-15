package br.com.willianmendesf.system.model.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class DistributionStatisticsDTO {
    private Integer totalIntercessors;
    private Integer totalCandidates;
    private Integer totalDistributed;
    private Integer totalNotDistributed;
    private Double distributionRate; // Percentual de distribuição
    private Integer totalChildren;
    private Integer totalAdults;
}

