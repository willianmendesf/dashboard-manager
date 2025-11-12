package br.com.willianmendesf.system.model.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.ALWAYS)
public class VisitorStatsDTO {
    @JsonFormat(pattern = "yyyy-MM-dd")
    private LocalDate data;
    private Long quantidade;
}

