package br.com.willianmendesf.system.model.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO para retornar informações básicas do cônjuge (nome e foto)
 * Usado no endpoint de busca por CPF para relacionamento de cônjuge
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class MemberSpouseDTO {
    private String nomeCompleto;
    private String fotoUrl;
}

