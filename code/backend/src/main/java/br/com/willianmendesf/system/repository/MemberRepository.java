package br.com.willianmendesf.system.repository;

import br.com.willianmendesf.system.model.entity.MemberEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

@Repository
public interface MemberRepository extends JpaRepository<MemberEntity, Long> {
    @Query("SELECT COALESCE(MAX(u.id), 0) FROM MemberEntity u")
    Long findMaxId();
}
