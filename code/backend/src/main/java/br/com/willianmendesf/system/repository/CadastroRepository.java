package br.com.willianmendesf.system.repository;

import br.com.willianmendesf.system.model.CadastroEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

@Repository
public interface CadastroRepository extends JpaRepository<CadastroEntity, Long> {
    @Query("SELECT COALESCE(MAX(u.id), 0) FROM CadastroEntity u")
    Long findMaxId();
}
