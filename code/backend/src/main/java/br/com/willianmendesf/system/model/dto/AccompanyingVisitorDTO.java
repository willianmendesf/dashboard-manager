package br.com.willianmendesf.system.model.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonProperty;

@Data
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class AccompanyingVisitorDTO {
    private String nomeCompleto;
    private Integer age;
    private String relationship;
    private String telefone;
    private String jaFrequentaIgreja;
    private String nomeIgreja;
    private String procuraIgreja;
    @JsonProperty("eDeSP")
    private Boolean eDeSP;
    private String estado;
}

