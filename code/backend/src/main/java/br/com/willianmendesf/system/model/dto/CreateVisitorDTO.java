package br.com.willianmendesf.system.model.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CreateVisitorDTO {
    private String nomeCompleto;
    private LocalDate dataVisita;
    private String telefone;
    private String jaFrequentaIgreja;
    private String procuraIgreja;
    @JsonProperty("eDeSP")
    private Boolean eDeSP;
    private String estado;
}

