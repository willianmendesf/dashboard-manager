package br.com.willianmendesf.system.model.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class DailyCountDTO {
    @JsonFormat(pattern = "yyyy-MM-dd")
    private LocalDate date;
    private Integer count;
}

