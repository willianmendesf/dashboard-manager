package br.com.willianmendesf.system.interfaces;

import br.com.willianmendesf.system.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

@Repository
public interface UserInterface extends JpaRepository<User, Long> {
    @Query("SELECT COALESCE(MAX(u.id), 0) FROM User u")
    Long findMaxId();
}
