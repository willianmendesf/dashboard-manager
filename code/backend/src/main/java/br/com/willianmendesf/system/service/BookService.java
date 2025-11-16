package br.com.willianmendesf.system.service;

import br.com.willianmendesf.system.exception.MembersException;
import br.com.willianmendesf.system.model.dto.BookDTO;
import br.com.willianmendesf.system.model.entity.BookEntity;
import br.com.willianmendesf.system.repository.BookRepository;
import br.com.willianmendesf.system.repository.LoanRepository;
import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@AllArgsConstructor
public class BookService {

    private final BookRepository bookRepository;
    private final LoanRepository loanRepository;

    public List<BookDTO> getAll() {
        try {
            log.info("Getting all books");
            return bookRepository.findAll().stream()
                    .map(book -> {
                        Long activeLoans = loanRepository.countActiveLoansByBookId(book.getId());
                        Integer quantidadeDisponivel = book.getQuantidadeTotal() - activeLoans.intValue();
                        return new BookDTO(book, quantidadeDisponivel);
                    })
                    .collect(Collectors.toList());
        } catch (Exception e) {
            log.error("Error getting all books", e);
            throw new MembersException("Erro ao buscar livros", e);
        }
    }

    public List<BookDTO> getAvailableBooks() {
        try {
            log.info("Getting available books");
            return bookRepository.findAll().stream()
                    .map(book -> {
                        Long activeLoans = loanRepository.countActiveLoansByBookId(book.getId());
                        Integer quantidadeDisponivel = book.getQuantidadeTotal() - activeLoans.intValue();
                        return new BookDTO(book, quantidadeDisponivel);
                    })
                    .filter(book -> book.getQuantidadeDisponivel() > 0)
                    .collect(Collectors.toList());
        } catch (Exception e) {
            log.error("Error getting available books", e);
            throw new MembersException("Erro ao buscar livros disponíveis", e);
        }
    }

    public BookDTO getById(Long id) {
        try {
            log.info("Getting book by ID: {}", id);
            BookEntity book = bookRepository.findById(id)
                    .orElseThrow(() -> new MembersException("Livro não encontrado com ID: " + id));
            Long activeLoans = loanRepository.countActiveLoansByBookId(book.getId());
            Integer quantidadeDisponivel = book.getQuantidadeTotal() - activeLoans.intValue();
            return new BookDTO(book, quantidadeDisponivel);
        } catch (MembersException e) {
            throw e;
        } catch (Exception e) {
            log.error("Error getting book by ID: {}", id, e);
            throw new MembersException("Erro ao buscar livro", e);
        }
    }

    @Transactional
    public BookDTO create(BookEntity book) {
        try {
            log.info("Creating book: {}", book.getTitulo());
            if (book.getTitulo() == null || book.getTitulo().trim().isEmpty()) {
                throw new MembersException("Título do livro é obrigatório");
            }
            if (book.getQuantidadeTotal() == null || book.getQuantidadeTotal() <= 0) {
                throw new MembersException("Quantidade total deve ser maior que zero");
            }
            BookEntity saved = bookRepository.save(book);
            return new BookDTO(saved, saved.getQuantidadeTotal());
        } catch (MembersException e) {
            throw e;
        } catch (Exception e) {
            log.error("Error creating book", e);
            throw new MembersException("Erro ao criar livro: " + e.getMessage(), e);
        }
    }

    @Transactional
    public BookDTO update(Long id, BookEntity bookData) {
        try {
            log.info("Updating book with ID: {}", id);
            BookEntity book = bookRepository.findById(id)
                    .orElseThrow(() -> new MembersException("Livro não encontrado com ID: " + id));
            
            if (bookData.getTitulo() != null && !bookData.getTitulo().trim().isEmpty()) {
                book.setTitulo(bookData.getTitulo());
            }
            if (bookData.getQuantidadeTotal() != null && bookData.getQuantidadeTotal() > 0) {
                book.setQuantidadeTotal(bookData.getQuantidadeTotal());
            }
            if (bookData.getFotoUrl() != null) {
                book.setFotoUrl(bookData.getFotoUrl());
            }
            
            BookEntity saved = bookRepository.save(book);
            Long activeLoans = loanRepository.countActiveLoansByBookId(saved.getId());
            Integer quantidadeDisponivel = saved.getQuantidadeTotal() - activeLoans.intValue();
            return new BookDTO(saved, quantidadeDisponivel);
        } catch (MembersException e) {
            throw e;
        } catch (Exception e) {
            log.error("Error updating book with ID: {}", id, e);
            throw new MembersException("Erro ao atualizar livro", e);
        }
    }

    @Transactional
    public void delete(Long id) {
        try {
            log.info("Deleting book with ID: {}", id);
            BookEntity book = bookRepository.findById(id)
                    .orElseThrow(() -> new MembersException("Livro não encontrado com ID: " + id));
            
            // Verificar se há empréstimos ativos
            Long activeLoans = loanRepository.countActiveLoansByBookId(id);
            if (activeLoans > 0) {
                throw new MembersException("Não é possível excluir o livro pois existem " + activeLoans + " empréstimo(s) ativo(s)");
            }
            
            bookRepository.delete(book);
        } catch (MembersException e) {
            throw e;
        } catch (Exception e) {
            log.error("Error deleting book with ID: {}", id, e);
            throw new MembersException("Erro ao excluir livro", e);
        }
    }
}

