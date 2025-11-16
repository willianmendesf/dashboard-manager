package br.com.willianmendesf.system.model.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class LoanDTO {
    private Long id;
    private Long bookId;
    private String bookTitulo;
    private String bookFotoUrl;
    private String memberCpf;
    private String memberNome;
    private String memberFotoUrl;
    private String memberCelular;
    private String memberTelefone;
    private LocalDate dataEmprestimo;
    private LocalDate dataDevolucao;
    private Boolean devolvido;
    private LocalDate dataDevolucaoReal;
    private String status; // "ativo", "vencido", "devolvido"
}

