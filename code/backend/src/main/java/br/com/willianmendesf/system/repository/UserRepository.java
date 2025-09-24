package br.com.willianmendesf.system.repository;

import br.com.willianmendesf.system.model.entity.UserEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

@Repository
public interface UserRepository extends JpaRepository<UserEntity, Long> {
    @Query("SELECT COALESCE(MAX(u.id), 0) FROM UserEntity u")
    Long findMaxId();

//    List<UserEntity> findFirstByOrderByCreatedAtDesc();
}
