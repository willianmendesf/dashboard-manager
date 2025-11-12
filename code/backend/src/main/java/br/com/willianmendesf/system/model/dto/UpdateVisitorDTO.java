package br.com.willianmendesf.system.model.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class UpdateVisitorDTO {
    private String nomeCompleto;
    private LocalDate dataVisita;
    private String telefone;
    private String jaFrequentaIgreja;
    private String procuraIgreja;
    private Boolean eDeSP;
    private String estado;
}

