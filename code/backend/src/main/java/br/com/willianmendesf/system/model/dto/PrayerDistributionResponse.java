package br.com.willianmendesf.system.model.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class PrayerDistributionResponse {
    private List<IntercessorDistributionDTO> distributions;
    private DistributionStatisticsDTO statistics;
}

