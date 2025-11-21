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
    
    MemberEntity findByEmail(String email);
    boolean existsByEmail(String email);
    
    @Query("SELECT DISTINCT m FROM MemberEntity m LEFT JOIN FETCH m.groups WHERE :groupId IN (SELECT g.id FROM m.groups g)")
    List<MemberEntity> findByGroupsId(@Param("groupId") Long groupId);
    
    @Query("SELECT DISTINCT m FROM MemberEntity m LEFT JOIN FETCH m.groups")
    List<MemberEntity> findAllWithGroups();
    
    @Query("SELECT DISTINCT m FROM MemberEntity m LEFT JOIN FETCH m.groups WHERE m.id = :id")
    java.util.Optional<MemberEntity> findByIdWithGroups(@Param("id") Long id);
    
    /**
     * Verifica se existe membro com o telefone ou celular informado (telefone sanitizado)
     */
    @Query("SELECT COUNT(m) > 0 FROM MemberEntity m " +
           "WHERE REPLACE(REPLACE(REPLACE(REPLACE(COALESCE(m.telefone, ''), '(', ''), ')', ''), '-', ''), ' ', '') = :phone " +
           "OR REPLACE(REPLACE(REPLACE(REPLACE(COALESCE(m.celular, ''), '(', ''), ')', ''), '-', ''), ' ', '') = :phone")
    boolean existsByTelefoneOrCelular(@Param("phone") String phone);
    
    /**
     * Busca membro por telefone ou celular (telefone sanitizado)
     */
    @Query("SELECT DISTINCT m FROM MemberEntity m LEFT JOIN FETCH m.groups " +
           "WHERE REPLACE(REPLACE(REPLACE(REPLACE(COALESCE(m.telefone, ''), '(', ''), ')', ''), '-', ''), ' ', '') = :phone " +
           "OR REPLACE(REPLACE(REPLACE(REPLACE(COALESCE(m.celular, ''), '(', ''), ')', ''), '-', ''), ' ', '') = :phone")
    MemberEntity findByTelefoneOrCelular(@Param("phone") String phone);
    
    /**
     * Busca membro por telefone do cônjuge (telefone sanitizado)
     * Usado para relacionamento de cônjuge - busca o membro que tem o telefone informado
     * como seu próprio telefone ou celular
     */
    @Query("SELECT DISTINCT m FROM MemberEntity m LEFT JOIN FETCH m.groups " +
           "WHERE REPLACE(REPLACE(REPLACE(REPLACE(COALESCE(m.telefone, ''), '(', ''), ')', ''), '-', ''), ' ', '') = :phone " +
           "OR REPLACE(REPLACE(REPLACE(REPLACE(COALESCE(m.celular, ''), '(', ''), ')', ''), '-', ''), ' ', '') = :phone")
    MemberEntity findByConjugueTelefone(@Param("phone") String phone);
    
    /**
     * Busca membro por telefone do pai/mãe (telefone sanitizado)
     * Usado para relacionamento de pais - busca o membro que tem o telefone informado
     * como seu próprio telefone, celular ou comercial
     */
    @Query("SELECT DISTINCT m FROM MemberEntity m LEFT JOIN FETCH m.groups " +
           "WHERE REPLACE(REPLACE(REPLACE(REPLACE(COALESCE(m.telefone, ''), '(', ''), ')', ''), '-', ''), ' ', '') = :phone " +
           "OR REPLACE(REPLACE(REPLACE(REPLACE(COALESCE(m.celular, ''), '(', ''), ')', ''), '-', ''), ' ', '') = :phone " +
           "OR REPLACE(REPLACE(REPLACE(REPLACE(COALESCE(m.comercial, ''), '(', ''), ')', ''), '-', ''), ' ', '') = :phone")
    MemberEntity findByParentTelefone(@Param("phone") String phone);
    
    /**
     * Busca filhos por telefone do pai/mãe (telefone sanitizado)
     * Usado para relacionamento de filhos - busca filhos onde telefonePai ou telefoneMae
     * corresponde ao telefone informado
     */
    @Query("SELECT DISTINCT m FROM MemberEntity m LEFT JOIN FETCH m.groups " +
           "WHERE m.child = true " +
           "AND (REPLACE(REPLACE(REPLACE(REPLACE(COALESCE(m.telefonePai, ''), '(', ''), ')', ''), '-', ''), ' ', '') = :phone " +
           "OR REPLACE(REPLACE(REPLACE(REPLACE(COALESCE(m.telefoneMae, ''), '(', ''), ')', ''), '-', ''), ' ', '') = :phone)")
    List<MemberEntity> findChildrenByTelefone(@Param("phone") String phone);
}
