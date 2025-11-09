package br.com.willianmendesf.system.model.dto;

import br.com.willianmendesf.system.model.entity.MemberEntity;
import lombok.AllArgsConstructor;
import lombok.Data;

import java.time.LocalDate;

@Data
@AllArgsConstructor
public class MemberDTO {
    private Long id;
    private String nome;
    private String email;
    private String celular;
    private String telefone;
    private LocalDate nascimento;
    private Integer idade;
    private String estadoCivil;
    private String cpf;
    private String rg;
    private String conjugueCPF;
    private String fotoUrl;

    public MemberDTO(MemberEntity member) {
        this.id = member.getId();
        this.nome = member.getNome();
        this.email = member.getEmail();
        this.nascimento = member.getNascimento();
        this.idade = member.getIdade();
        this.telefone = member.getTelefone();
        this.celular = member.getCelular();
        this.estadoCivil = (member.getEstadoCivil() == Boolean.FALSE) ? "Solteiro" : "Casado";
        this.cpf = member.getCpf();
        this.rg = member.getRg();
        this.conjugueCPF = member.getConjugueCPF();
        this.fotoUrl = member.getFotoUrl();
    }
}
