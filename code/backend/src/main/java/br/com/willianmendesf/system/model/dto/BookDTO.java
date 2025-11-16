package br.com.willianmendesf.system.model.dto;

import br.com.willianmendesf.system.model.entity.BookEntity;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class BookDTO {
    private Long id;
    private String titulo;
    private String fotoUrl;
    private Integer quantidadeTotal;
    private Integer quantidadeDisponivel;

    public BookDTO(BookEntity book, Integer quantidadeDisponivel) {
        this.id = book.getId();
        this.titulo = book.getTitulo();
        this.fotoUrl = book.getFotoUrl();
        this.quantidadeTotal = book.getQuantidadeTotal();
        this.quantidadeDisponivel = quantidadeDisponivel;
    }
}

