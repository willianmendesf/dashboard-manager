package br.com.willianmendesf.system.model.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class VisitorChartPreferenceDTO {
    private Boolean useCustomRange;
    private LocalDate chartStartDate;
    private LocalDate chartEndDate;
}

