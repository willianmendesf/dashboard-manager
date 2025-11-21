package br.com.willianmendesf.system.model.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * DTO para retornar informações básicas de filhos (nome, foto e celular)
 * Usado no endpoint de busca por telefone para relacionamento de filhos
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class MemberChildrenDTO {
    private String nomeCompleto;
    private String fotoUrl;
    private String celular;
}

