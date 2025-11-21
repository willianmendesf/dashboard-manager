package br.com.willianmendesf.system.service;

import br.com.willianmendesf.system.exception.MembersException;
import br.com.willianmendesf.system.model.dto.CreateLoanDTO;
import br.com.willianmendesf.system.model.dto.LoanDTO;
import br.com.willianmendesf.system.model.entity.BookEntity;
import br.com.willianmendesf.system.model.entity.LoanEntity;
import br.com.willianmendesf.system.model.entity.MemberEntity;
import br.com.willianmendesf.system.repository.BookRepository;
import br.com.willianmendesf.system.repository.LoanRepository;
import br.com.willianmendesf.system.repository.MemberRepository;
import br.com.willianmendesf.system.service.utils.PhoneUtil;
import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@AllArgsConstructor
public class LoanService {

    private final LoanRepository loanRepository;
    private final BookRepository bookRepository;
    private final MemberRepository memberRepository;

    public List<LoanDTO> getAll() {
        try {
            log.info("Getting all loans");
            return loanRepository.findAll().stream()
                    .map(this::toDTO)
                    .collect(Collectors.toList());
        } catch (Exception e) {
            log.error("Error getting all loans", e);
            throw new MembersException("Erro ao buscar empréstimos", e);
        }
    }

    public LoanDTO getById(Long id) {
        try {
            log.info("Getting loan by ID: {}", id);
            LoanEntity loan = loanRepository.findById(id)
                    .orElseThrow(() -> new MembersException("Empréstimo não encontrado com ID: " + id));
            return toDTO(loan);
        } catch (MembersException e) {
            throw e;
        } catch (Exception e) {
            log.error("Error getting loan by ID: {}", id, e);
            throw new MembersException("Erro ao buscar empréstimo", e);
        }
    }

    @Transactional
    public LoanDTO create(CreateLoanDTO dto) {
        try {
            log.info("Creating loan for book ID: {} and Phone: {}", dto.getBookId(), dto.getMemberPhone());
            
            // Sanitizar telefone (remover caracteres especiais)
            String sanitizedPhone = PhoneUtil.sanitizeAndValidate(dto.getMemberPhone());
            if (sanitizedPhone == null) {
                log.warn("Invalid phone number: {}", dto.getMemberPhone());
                throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Telefone inválido. Por favor, verifique o número informado."
                );
            }
            
            // Buscar membro por telefone ou celular
            MemberEntity member = memberRepository.findByTelefoneOrCelular(sanitizedPhone);
            if (member == null) {
                log.warn("Phone not found in members database: {}", sanitizedPhone);
                throw new ResponseStatusException(
                    HttpStatus.NOT_FOUND,
                    "Telefone não encontrado na base de membros. É necessário falar com um diácono para se cadastrar antes de realizar empréstimos."
                );
            }
            
            // Buscar livro
            BookEntity book = bookRepository.findById(dto.getBookId())
                    .orElseThrow(() -> new MembersException("Livro não encontrado com ID: " + dto.getBookId()));
            
            // Verificar disponibilidade do livro
            Long activeLoans = loanRepository.countActiveLoansByBookId(book.getId());
            if (activeLoans >= book.getQuantidadeTotal()) {
                log.warn("Book not available. Active loans: {}, Total quantity: {}", activeLoans, book.getQuantidadeTotal());
                throw new MembersException("Livro não está disponível. Todos os exemplares estão emprestados.");
            }
            
            // Criar empréstimo usando telefone
            LoanEntity loan = new LoanEntity();
            loan.setBook(book);
            loan.setMemberPhone(sanitizedPhone);
            loan.setDataEmprestimo(LocalDate.now());
            loan.setDataDevolucao(LocalDate.now().plusMonths(1));
            loan.setDevolvido(false);
            
            LoanEntity saved = loanRepository.save(loan);
            log.info("Loan created with ID: {}", saved.getId());
            
            return toDTO(saved, member);
        } catch (ResponseStatusException e) {
            throw e;
        } catch (MembersException e) {
            throw e;
        } catch (Exception e) {
            log.error("Error creating loan", e);
            throw new MembersException("Erro ao criar empréstimo: " + e.getMessage(), e);
        }
    }

    @Transactional
    public LoanDTO markAsReturned(Long id) {
        try {
            log.info("Marking loan as returned: {}", id);
            LoanEntity loan = loanRepository.findById(id)
                    .orElseThrow(() -> new MembersException("Empréstimo não encontrado com ID: " + id));
            
            if (loan.getDevolvido()) {
                throw new MembersException("Empréstimo já foi devolvido");
            }
            
            loan.setDevolvido(true);
            loan.setDataDevolucaoReal(LocalDate.now());
            
            LoanEntity saved = loanRepository.save(loan);
            
            // Buscar membro para o DTO usando telefone
            MemberEntity member = memberRepository.findByTelefoneOrCelular(saved.getMemberPhone());
            
            return toDTO(saved, member);
        } catch (MembersException e) {
            throw e;
        } catch (Exception e) {
            log.error("Error marking loan as returned: {}", id, e);
            throw new MembersException("Erro ao marcar empréstimo como devolvido", e);
        }
    }

    private LoanDTO toDTO(LoanEntity loan) {
        MemberEntity member = null;
        
        // Buscar membro por telefone
        if (loan.getMemberPhone() != null && !loan.getMemberPhone().trim().isEmpty()) {
            member = memberRepository.findByTelefoneOrCelular(loan.getMemberPhone());
        }
        
        return toDTO(loan, member);
    }

    private LoanDTO toDTO(LoanEntity loan, MemberEntity member) {
        LoanDTO dto = new LoanDTO();
        dto.setId(loan.getId());
        dto.setBookId(loan.getBook().getId());
        dto.setBookTitulo(loan.getBook().getTitulo());
        dto.setBookFotoUrl(loan.getBook().getFotoUrl());
        dto.setMemberPhone(loan.getMemberPhone());
        dto.setMemberNome(member != null ? member.getNome() : null);
        dto.setMemberFotoUrl(member != null ? member.getFotoUrl() : null);
        dto.setMemberCelular(member != null ? member.getCelular() : null);
        dto.setMemberTelefone(member != null ? member.getTelefone() : null);
        dto.setDataEmprestimo(loan.getDataEmprestimo());
        dto.setDataDevolucao(loan.getDataDevolucao());
        dto.setDevolvido(loan.getDevolvido());
        dto.setDataDevolucaoReal(loan.getDataDevolucaoReal());
        
        // Calcular status
        if (dto.getDevolvido()) {
            dto.setStatus("devolvido");
        } else if (LocalDate.now().isAfter(loan.getDataDevolucao())) {
            dto.setStatus("vencido");
        } else {
            dto.setStatus("ativo");
        }
        
        return dto;
    }
}

