package br.com.willianmendesf.system.model.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;

import java.time.LocalDate;
import java.util.HashSet;
import java.util.Set;

@Data
@AllArgsConstructor
@Entity
@Table(name = "register")
@JsonIgnoreProperties(ignoreUnknown = true)
public class MemberEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "nome", nullable = false)
    private String nome;

    @Column(name = "conjugueTelefone", length = 20)
    private String conjugueTelefone;

    @Column(name = "telefonePai", length = 20)
    private String telefonePai;

    @Column(name = "telefoneMae", length = 20)
    private String telefoneMae;

    @Column(name = "comungante")
    private Boolean comungante;

    @Column(name = "intercessor", nullable = false)
    private Boolean intercessor = false;

    @Column(name = "child", nullable = false)
    private Boolean child = false;

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

    @Column(name = "email")
    private String email;

    @Column(columnDefinition = "TEXT")
    private String grupos;

    @Column(name = "lgpd")
    private Boolean lgpd;

    @Column(name = "lgpd_aceito_em")
    private LocalDate lgpdAceitoEm;

    @Column(name = "foto_url", length = 500)
    private String fotoUrl;

    @Column(name = "has_children")
    private Boolean hasChildren = false;

    @Version // 30 campos
    @Column(name = "version")
    private Long version;

    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(
        name = "member_groups",
        joinColumns = @JoinColumn(name = "member_id"),
        inverseJoinColumns = @JoinColumn(name = "group_id")
    )
    private Set<GroupEntity> groups = new HashSet<>();

    public MemberEntity() {}

    public MemberEntity(MemberEntity member) {
        this.id = member.getId();
        this.nome = member.getNome();
        this.conjugueTelefone = member.getConjugueTelefone();
        this.telefonePai = member.getTelefonePai();
        this.telefoneMae = member.getTelefoneMae();
        this.comungante = member.getComungante();
        this.intercessor = member.getIntercessor();
        this.child = member.getChild();
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
        this.email = member.getEmail();
        this.grupos = member.getGrupos();
        this.lgpd = member.getLgpd();
        this.lgpdAceitoEm = member.getLgpdAceitoEm();
        this.fotoUrl = member.getFotoUrl();
        this.hasChildren = member.getHasChildren();
        this.version = member.getVersion();
    }

    public MemberEntity(MemberEntity actual, MemberEntity newValue) {
        this.id = (actual.getId() != null) ? actual.getId() : newValue.getId();
        this.nome = (isNotEmpty(actual.getNome())) ? actual.getNome() : newValue.getNome();
        this.conjugueTelefone = (isNotEmpty(actual.getConjugueTelefone())) ? actual.getConjugueTelefone() : newValue.getConjugueTelefone();
        this.telefonePai = (isNotEmpty(actual.getTelefonePai())) ? actual.getTelefonePai() : newValue.getTelefonePai();
        this.telefoneMae = (isNotEmpty(actual.getTelefoneMae())) ? actual.getTelefoneMae() : newValue.getTelefoneMae();
        this.comungante = (actual.getComungante() != null) ? actual.getComungante() : newValue.getComungante();
        this.intercessor = (actual.getIntercessor() != null) ? actual.getIntercessor() : newValue.getIntercessor();
        this.child = (actual.getChild() != null) ? actual.getChild() : newValue.getChild();
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
        this.email = (isNotEmpty(actual.getEmail())) ? actual.getEmail() : newValue.getEmail();
        this.grupos = (isNotEmpty(actual.getGrupos())) ? actual.getGrupos() : newValue.getGrupos();
        this.lgpd = (actual.getLgpd() != null) ? actual.getLgpd() : newValue.getLgpd();
        this.lgpdAceitoEm = (actual.getLgpdAceitoEm() != null) ? actual.getLgpdAceitoEm() : newValue.getLgpdAceitoEm();
        this.fotoUrl = (isNotEmpty(actual.getFotoUrl())) ? actual.getFotoUrl() : newValue.getFotoUrl();
        this.hasChildren = (actual.getHasChildren() != null) ? actual.getHasChildren() : newValue.getHasChildren();
        this.version = (actual.getVersion() != null) ? actual.getVersion() : newValue.getVersion();
    }

    private boolean isNotEmpty(String str) {
        return str != null && !str.trim().isEmpty();
    }


}

