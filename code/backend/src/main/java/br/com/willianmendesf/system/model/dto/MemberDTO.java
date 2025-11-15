package br.com.willianmendesf.system.model.dto;

import br.com.willianmendesf.system.model.entity.GroupEntity;
import br.com.willianmendesf.system.model.entity.MemberEntity;
import lombok.AllArgsConstructor;
import lombok.Data;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Data
@AllArgsConstructor
public class MemberDTO {
    private Long id;
    private String nome;
    private String email;
    private String celular;
    private String telefone;
    private String comercial;
    private LocalDate nascimento;
    private Integer idade;
    private String estadoCivil;
    private String cpf;
    private String rg;
    private String conjugueCPF;
    private Boolean comungante;
    private Boolean child;
    private String tipoCadastro;
    private String fotoUrl;
    private Boolean intercessor;
    private String cep;
    private String logradouro;
    private String numero;
    private String complemento;
    private String bairro;
    private String cidade;
    private String estado;
    private Boolean lgpd;
    private LocalDate lgpdAceitoEm;
    private List<Long> groupIds;

    public MemberDTO(MemberEntity member) {
        this.id = member.getId();
        this.nome = member.getNome();
        this.email = member.getEmail();
        this.nascimento = member.getNascimento();
        this.idade = member.getIdade();
        this.telefone = member.getTelefone();
        this.comercial = member.getComercial();
        this.celular = member.getCelular();
        this.estadoCivil = (member.getEstadoCivil() == Boolean.FALSE) ? "Solteiro" : "Casado";
        this.cpf = member.getCpf();
        this.rg = member.getRg();
        this.conjugueCPF = member.getConjugueCPF();
        this.comungante = member.getComungante();
        this.child = member.getChild();
        this.tipoCadastro = member.getTipoCadastro();
        this.fotoUrl = member.getFotoUrl();
        this.intercessor = member.getIntercessor();
        this.cep = member.getCep();
        this.logradouro = member.getLogradouro();
        this.numero = member.getNumero();
        this.complemento = member.getComplemento();
        this.bairro = member.getBairro();
        this.cidade = member.getCidade();
        this.estado = member.getEstado();
        this.lgpd = member.getLgpd();
        this.lgpdAceitoEm = member.getLgpdAceitoEm();
        this.groupIds = member.getGroups() != null && !member.getGroups().isEmpty()
            ? member.getGroups().stream().map(GroupEntity::getId).collect(Collectors.toList())
            : new ArrayList<>();
    }
}
