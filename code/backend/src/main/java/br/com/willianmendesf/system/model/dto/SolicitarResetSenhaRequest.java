package br.com.willianmendesf.system.model.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class SolicitarResetSenhaRequest {
    private String cpf;
    private String telefone; // Pode ser celular ou telefone
}

