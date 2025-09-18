package br.com.willianmendesf.system.model.dto;

import br.com.willianmendesf.system.model.CadastroEntity;
import lombok.Data;

import java.time.LocalDate;

@Data
public class CadastroDTO {
    private Long id;
    private String nome;
    private String email;
    private LocalDate nascimento;
    private String telefone;

    public CadastroDTO(CadastroEntity cadastroEntity) {
        this.id = cadastroEntity.getId();
        this.nome = cadastroEntity.getNome();
        this.email = cadastroEntity.getEmail();
        this.nascimento = cadastroEntity.getNascimento();
        this.telefone = cadastroEntity.getTelefone();
    }
}
