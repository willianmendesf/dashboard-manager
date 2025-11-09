package br.com.willianmendesf.system.model.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;

import java.time.LocalDate;

@Data
@AllArgsConstructor
@Entity
@Table(name = "register")
public class MemberEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "nome", nullable = false)
    private String nome;

    @Column(name = "cpf", length = 14)
    private String cpf;

    @Column(name = "rg", length = 20)
    private String rg;

    @Column(name = "conjugueCPF", length = 14)
    private String conjugueCPF;

    @Column(name = "comungante")
    private Boolean comungante;

    @Column(name = "intercessor", nullable = false)
    private Boolean intercessor = false;

    @Column(name = "tipo_cadastro")
    private String tipoCadastro;

    @Column(name = "nascimento")
    private LocalDate nascimento;

    @Column(name = "idade")
    private Integer idade;

    @Column(name = "estado_civil", nullable = false)
    private Boolean estadoCivil;

    @Column(name = "cep")
    private String cep;

    @Column(name = "logradouro")
    private String logradouro;

    @Column(name = "numero")
    private String numero;

    @Column(name = "complemento")
    private String complemento;

    @Column(name = "bairro")
    private String bairro;

    @Column(name = "cidade")
    private String cidade;

    @Column(name = "estado")
    private String estado;

    @Column(name = "telefone")
    private String telefone;

    @Column(name = "comercial")
    private String comercial;

    @Column(name = "celular")
    private String celular;

    @Column(name = "contato")
    private String contato;

    @Column(name = "email")
    private String email;

    @Column(columnDefinition = "TEXT")
    private String grupos;

    @Column(name = "lgpd")
    private Boolean lgpd;

    @Column(name = "lgpd_aceito_em")
    private LocalDate lgpdAceitoEm;

    @Column(name = "rede")
    private String rede;

    @Column(name = "foto_url", length = 500)
    private String fotoUrl;

    @Version // 30 campos
    @Column(name = "version")
    private Long version;

    public MemberEntity() {}

    public MemberEntity(MemberEntity member) {
        this.id = member.getId();
        this.nome = member.getNome();
        this.cpf = member.getCpf();
        this.rg = member.getRg();
        this.conjugueCPF = member.getConjugueCPF();
        this.comungante = member.getComungante();
        this.intercessor = member.getIntercessor();
        this.tipoCadastro = member.getTipoCadastro();
        this.nascimento = member.getNascimento();
        this.idade = member.getIdade();
        this.estadoCivil = member.getEstadoCivil();
        this.cep = member.getCep();
        this.logradouro = member.getLogradouro();
        this.numero = member.getNumero();
        this.complemento = member.getComplemento();
        this.bairro = member.getBairro();
        this.cidade = member.getCidade();
        this.estado = member.getEstado();
        this.telefone = member.getTelefone();
        this.comercial = member.getComercial();
        this.celular = member.getCelular();
        this.contato = member.getContato();
        this.email = member.getEmail();
        this.grupos = member.getGrupos();
        this.lgpd = member.getLgpd();
        this.lgpdAceitoEm = member.getLgpdAceitoEm();
        this.rede = member.getRede();
        this.fotoUrl = member.getFotoUrl();
        this.version = member.getVersion();
    }

    public MemberEntity(MemberEntity actual, MemberEntity newValue) {
        this.id = (actual.getId() != null) ? actual.getId() : newValue.getId();
        this.nome = (isNotEmpty(actual.getNome())) ? actual.getNome() : newValue.getNome();
        this.cpf = (isNotEmpty(actual.getCpf())) ? actual.getCpf() : newValue.getCpf();
        this.rg = (isNotEmpty(actual.getRg())) ? actual.getRg() : newValue.getRg();
        this.conjugueCPF = (isNotEmpty(actual.getConjugueCPF())) ? actual.getConjugueCPF() : newValue.getConjugueCPF();
        this.comungante = (actual.getComungante() != null) ? actual.getComungante() : newValue.getComungante();
        this.intercessor = (actual.getIntercessor() != null) ? actual.getIntercessor() : newValue.getIntercessor();
        this.tipoCadastro = (isNotEmpty(actual.getTipoCadastro())) ? actual.getTipoCadastro() : newValue.getTipoCadastro();
        this.nascimento = (actual.getNascimento() != null) ? actual.getNascimento() : newValue.getNascimento();
        this.idade = (actual.getIdade() != null) ? actual.getIdade() : newValue.getIdade();
        this.estadoCivil = (actual.getEstadoCivil() != null) ? actual.getEstadoCivil() : newValue.getEstadoCivil();
        this.cep = (isNotEmpty(actual.getCep())) ? actual.getCep() : newValue.getCep();
        this.logradouro = (isNotEmpty(actual.getLogradouro())) ? actual.getLogradouro() : newValue.getLogradouro();
        this.numero = (isNotEmpty(actual.getNumero())) ? actual.getNumero() : newValue.getNumero();
        this.complemento = (isNotEmpty(actual.getComplemento())) ? actual.getComplemento() : newValue.getComplemento();
        this.bairro = (isNotEmpty(actual.getBairro())) ? actual.getBairro() : newValue.getBairro();
        this.cidade = (isNotEmpty(actual.getCidade())) ? actual.getCidade() : newValue.getCidade();
        this.estado = (isNotEmpty(actual.getEstado())) ? actual.getEstado() : newValue.getEstado();
        this.telefone = (isNotEmpty(actual.getTelefone())) ? actual.getTelefone() : newValue.getTelefone();
        this.comercial = (isNotEmpty(actual.getComercial())) ? actual.getComercial() : newValue.getComercial();
        this.celular = (isNotEmpty(actual.getCelular())) ? actual.getCelular() : newValue.getCelular();
        this.contato = (isNotEmpty(actual.getContato())) ? actual.getContato() : newValue.getContato();
        this.email = (isNotEmpty(actual.getEmail())) ? actual.getEmail() : newValue.getEmail();
        this.grupos = (isNotEmpty(actual.getGrupos())) ? actual.getGrupos() : newValue.getGrupos();
        this.lgpd = (actual.getLgpd() != null) ? actual.getLgpd() : newValue.getLgpd();
        this.lgpdAceitoEm = (actual.getLgpdAceitoEm() != null) ? actual.getLgpdAceitoEm() : newValue.getLgpdAceitoEm();
        this.rede = (isNotEmpty(actual.getRede())) ? actual.getRede() : newValue.getRede();
        this.fotoUrl = (isNotEmpty(actual.getFotoUrl())) ? actual.getFotoUrl() : newValue.getFotoUrl();
        this.version = (actual.getVersion() != null) ? actual.getVersion() : newValue.getVersion();
    }

    private boolean isNotEmpty(String str) {
        return str != null && !str.trim().isEmpty();
    }


}

