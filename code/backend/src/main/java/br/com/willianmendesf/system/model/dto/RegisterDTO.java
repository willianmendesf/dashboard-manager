package br.com.willianmendesf.system.model.dto;

import br.com.willianmendesf.system.model.entity.RegisterEntity;
import lombok.AllArgsConstructor;
import lombok.Data;

import java.time.LocalDate;

@Data
@AllArgsConstructor
public class RegisterDTO {
    private Long id;
    private String nome;
    private String email;
    private LocalDate nascimento;
    private Integer idade;
    private String estadoCivil;
    private String telefone;

    public RegisterDTO(RegisterEntity registerEntity) {
        this.id = registerEntity.getId();
        this.nome = registerEntity.getNome();
        this.email = registerEntity.getEmail();
        this.nascimento = registerEntity.getNascimento();
        this.idade = registerEntity.getIdade();
        this.telefone = registerEntity.getTelefone();
        this.estadoCivil = registerEntity.getEstadoCivil();
    }
}
