package br.com.willianmendesf.system.model.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class AccompanyingVisitorDTO {
    private String nomeCompleto;
    private Integer age;
    private String relationship;
}

