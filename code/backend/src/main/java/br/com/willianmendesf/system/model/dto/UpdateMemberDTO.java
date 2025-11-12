package br.com.willianmendesf.system.model.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.util.List;

/**
 * DTO para atualização de dados de membro via portal público
 * CPF não deve ser incluído aqui (write-once protection)
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class UpdateMemberDTO {
    private String nome;
    private String email;
    private String telefone;
    private String comercial;
    private String celular;
    private String cep;
    private String logradouro;
    private String numero;
    private String complemento;
    private String bairro;
    private String cidade;
    private String estado;
    private LocalDate nascimento;
    private Integer idade;
    private Boolean estadoCivil;
    private String rg;
    private String conjugueCPF;
    private Boolean child;
    private String tipoCadastro;
    private List<Long> groupIds;
}

