package br.com.willianmendesf.system.repository;

import br.com.willianmendesf.system.model.entity.GroupEnrollment;
import br.com.willianmendesf.system.model.enums.EnrollmentStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface GroupEnrollmentRepository extends JpaRepository<GroupEnrollment, Long> {
    
    List<GroupEnrollment> findByMemberId(Long memberId);
    
    List<GroupEnrollment> findByGroupId(Long groupId);
    
    List<GroupEnrollment> findByStatus(EnrollmentStatus status);
    
    Optional<GroupEnrollment> findByMemberIdAndGroupId(Long memberId, Long groupId);
    
    @Query("SELECT ge FROM GroupEnrollment ge WHERE ge.member.id = :memberId AND ge.group.id = :groupId")
    List<GroupEnrollment> findByMemberIdAndGroupIdList(@Param("memberId") Long memberId, @Param("groupId") Long groupId);
    
    @Query("SELECT ge FROM GroupEnrollment ge WHERE ge.status = :status ORDER BY ge.requestedAt DESC")
    List<GroupEnrollment> findPendingEnrollments(@Param("status") EnrollmentStatus status);
    
    @Query("SELECT ge FROM GroupEnrollment ge WHERE ge.group.id = :groupId AND ge.status = 'APPROVED'")
    List<GroupEnrollment> findApprovedByGroupId(@Param("groupId") Long groupId);
    
    @Query("SELECT ge FROM GroupEnrollment ge WHERE ge.member.id = :memberId AND ge.group.id = :groupId AND ge.status = 'REJECTED' ORDER BY ge.rejectedAt DESC")
    Optional<GroupEnrollment> findLastRejected(@Param("memberId") Long memberId, @Param("groupId") Long groupId);
    
    @Query("SELECT ge FROM GroupEnrollment ge WHERE ge.status != 'PENDING' ORDER BY ge.processedAt DESC, ge.rejectedAt DESC, ge.requestedAt DESC")
    List<GroupEnrollment> findAllProcessedEnrollments();
}

