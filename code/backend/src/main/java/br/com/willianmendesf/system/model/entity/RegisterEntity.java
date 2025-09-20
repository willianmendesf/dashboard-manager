package br.com.willianmendesf.system.model.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Entity
@Table(name = "register")
public class RegisterEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private String nome;
    private String subtipo;
    private LocalDate nascimento;
    private Integer idade;
    private String cep;
    private String logradouro;
    private String numero;
    private String complemento;
    private String bairro;
    private String cidade;
    private String estado;
    private String telefone;
    private String comercial;
    private String celular;
    private String operadora;
    private String contato;
    private String email;

    @Column(name = "tipo_cadastro")
    private String tipoCadastro;

    @Column(name = "estado_civil")
    private String estadoCivil;

    @Column(columnDefinition = "TEXT")
    private String grupos;

    @Enumerated(EnumType.STRING)
    private LgpdStatus lgpd;

    @Column(name = "lgpd_aceito_em")
    private LocalDateTime lgpdAceitoEm;

    private String rede;

    public enum LgpdStatus {
        Sim,
        Nao
    }

}

