package br.com.willianmendesf.system.model.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class AttendanceChartPreferenceDTO {
    private Boolean useCustomRange;
    private LocalDate chartStartDate;
    private LocalDate chartEndDate;
    private Boolean includeVisitorsInPresence;
    private Boolean showVisitorsSeparate;
    private Boolean showAbsences;
    private Boolean showAverage;
    private Integer defaultIntervalMonths;
    private String periodType; // 'weeks', 'months', 'years'
    private String averagePeriodType; // 'monthly', 'bimonthly', 'quarterly', 'semester', 'annual', 'full'
}

