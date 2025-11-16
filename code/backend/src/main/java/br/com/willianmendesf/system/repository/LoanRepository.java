package br.com.willianmendesf.system.repository;

import br.com.willianmendesf.system.model.entity.LoanEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface LoanRepository extends JpaRepository<LoanEntity, Long> {
    
    List<LoanEntity> findByMemberCpf(String memberCpf);
    
    @Query("SELECT l FROM LoanEntity l WHERE l.devolvido = false")
    List<LoanEntity> findActiveLoans();
    
    @Query("SELECT l FROM LoanEntity l WHERE l.devolvido = false AND l.dataDevolucao < CURRENT_DATE")
    List<LoanEntity> findOverdueLoans();
    
    @Query("SELECT COUNT(l) FROM LoanEntity l WHERE l.book.id = :bookId AND l.devolvido = false")
    Long countActiveLoansByBookId(@Param("bookId") Long bookId);
    
    @Query("SELECT l FROM LoanEntity l WHERE l.book.id = :bookId AND l.devolvido = false")
    List<LoanEntity> findActiveLoansByBookId(@Param("bookId") Long bookId);
}

