package br.com.willianmendesf.system.repository;

import br.com.willianmendesf.system.model.entity.MemberEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface MemberRepository extends JpaRepository<MemberEntity, Long> {
    @Query("SELECT COALESCE(MAX(u.id), 0) FROM MemberEntity u")
    Long findMaxId();
    
    MemberEntity findByCpf(String cpf);
    
    @Query("SELECT DISTINCT m FROM MemberEntity m LEFT JOIN FETCH m.groups WHERE m.cpf = :cpf")
    MemberEntity findByCpfWithGroups(@Param("cpf") String cpf);
    
    MemberEntity findByEmail(String email);
    boolean existsByEmail(String email);
    
    @Query("SELECT DISTINCT m FROM MemberEntity m LEFT JOIN FETCH m.groups WHERE :groupId IN (SELECT g.id FROM m.groups g)")
    List<MemberEntity> findByGroupsId(@Param("groupId") Long groupId);
    
    @Query("SELECT DISTINCT m FROM MemberEntity m LEFT JOIN FETCH m.groups")
    List<MemberEntity> findAllWithGroups();
    
    @Query("SELECT DISTINCT m FROM MemberEntity m LEFT JOIN FETCH m.groups WHERE m.id = :id")
    java.util.Optional<MemberEntity> findByIdWithGroups(@Param("id") Long id);
}
