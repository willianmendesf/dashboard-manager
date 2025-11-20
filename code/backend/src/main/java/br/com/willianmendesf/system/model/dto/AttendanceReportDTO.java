package br.com.willianmendesf.system.model.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class AttendanceReportDTO {
    private MemberDTO member;
    private Integer totalEvents;
    private Integer presenceCount;
    private Integer absenceCount;
    private Double presencePercentage;
}

