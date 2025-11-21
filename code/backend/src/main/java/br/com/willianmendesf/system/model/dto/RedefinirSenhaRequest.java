package br.com.willianmendesf.system.model.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class RedefinirSenhaRequest {
    private String telefone;
    private String codigo; // OTP de 6 dígitos
    private String novaSenha;
}

