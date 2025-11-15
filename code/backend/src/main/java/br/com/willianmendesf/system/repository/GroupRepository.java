package br.com.willianmendesf.system.repository;

import br.com.willianmendesf.system.model.entity.GroupEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface GroupRepository extends JpaRepository<GroupEntity, Long> {
    Optional<GroupEntity> findByNome(String nome);
    
    @Query("SELECT COUNT(m) FROM MemberEntity m JOIN m.groups g WHERE g.id = :groupId")
    Long countMembersByGroupId(@Param("groupId") Long groupId);
}

