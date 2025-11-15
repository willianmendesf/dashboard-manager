package br.com.willianmendesf.system.repository;

import br.com.willianmendesf.system.model.entity.User;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
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
    boolean existsByUsername(String username);
    boolean existsByEmail(String email);
    boolean existsByCpf(String cpf);
    boolean existsByTelefone(String telefone);
    
    // For update validation (check if exists in another user)
    boolean existsByUsernameAndIdNot(String username, Long id);
    boolean existsByEmailAndIdNot(String email, Long id);
    boolean existsByCpfAndIdNot(String cpf, Long id);
    boolean existsByTelefoneAndIdNot(String telefone, Long id);
}
