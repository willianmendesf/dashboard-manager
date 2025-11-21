package br.com.willianmendesf.system.repository;

import br.com.willianmendesf.system.model.entity.User;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    
    /**
     * Busca usuário por username carregando eager o profile e suas permissões
     * Isso evita LazyInitializationException quando @PreAuthorize acessa as permissões
     */
    @EntityGraph(attributePaths = {"profile", "profile.permissions"})
    Optional<User> findByUsername(String username);
    
    Optional<User> findByEmail(String email);
    Optional<User> findByTelefone(String telefone);
    boolean existsByUsername(String username);
    boolean existsByEmail(String email);
    boolean existsByTelefone(String telefone);
    
    /**
     * Verifica se existe usuário com o telefone informado (telefone sanitizado)
     */
    @Query("SELECT COUNT(u) > 0 FROM User u " +
           "WHERE REPLACE(REPLACE(REPLACE(REPLACE(COALESCE(u.telefone, ''), '(', ''), ')', ''), '-', ''), ' ', '') = :phone")
    boolean existsByTelefoneSanitized(@Param("phone") String phone);
    
    /**
     * Busca usuário por telefone (telefone sanitizado)
     */
    @Query("SELECT u FROM User u " +
           "WHERE REPLACE(REPLACE(REPLACE(REPLACE(COALESCE(u.telefone, ''), '(', ''), ')', ''), '-', ''), ' ', '') = :phone")
    Optional<User> findByTelefoneSanitized(@Param("phone") String phone);
    
    // For update validation (check if exists in another user)
    boolean existsByUsernameAndIdNot(String username, Long id);
    boolean existsByEmailAndIdNot(String email, Long id);
    boolean existsByTelefoneAndIdNot(String telefone, Long id);
}
