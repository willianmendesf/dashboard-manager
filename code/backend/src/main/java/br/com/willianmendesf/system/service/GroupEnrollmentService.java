package br.com.willianmendesf.system.service;

import br.com.willianmendesf.system.exception.MembersException;
import br.com.willianmendesf.system.model.dto.GroupEnrollmentDTO;
import br.com.willianmendesf.system.model.dto.MemberDTO;
import br.com.willianmendesf.system.model.dto.RejectEnrollmentDTO;
import br.com.willianmendesf.system.model.entity.GroupEnrollment;
import br.com.willianmendesf.system.model.entity.GroupEntity;
import br.com.willianmendesf.system.model.entity.MemberEntity;
import br.com.willianmendesf.system.model.enums.EnrollmentStatus;
import br.com.willianmendesf.system.repository.GroupEnrollmentRepository;
import br.com.willianmendesf.system.repository.GroupRepository;
import br.com.willianmendesf.system.repository.MemberRepository;
import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@AllArgsConstructor
public class GroupEnrollmentService {

    private final GroupEnrollmentRepository enrollmentRepository;
    private final MemberRepository memberRepository;
    private final GroupRepository groupRepository;

    @Transactional
    public GroupEnrollmentDTO requestEnrollment(Long memberId, Long groupId) {
        try {
            log.info("Requesting enrollment for member ID: {} in group ID: {}", memberId, groupId);
            
            MemberEntity member = memberRepository.findById(memberId)
                    .orElseThrow(() -> new MembersException("Member not found with ID: " + memberId));
            
            GroupEntity group = groupRepository.findById(groupId)
                    .orElseThrow(() -> new MembersException("Group not found with ID: " + groupId));

            // Verificar se já existe enrollment
            var existingEnrollment = enrollmentRepository.findByMemberIdAndGroupId(memberId, groupId);
            
            if (existingEnrollment.isPresent()) {
                GroupEnrollment enrollment = existingEnrollment.get();
                
                // Se está REJECTED, verificar se pode solicitar novamente
                if (enrollment.getStatus() == EnrollmentStatus.REJECTED) {
                    if (!canRequestAgain(memberId, groupId)) {
                        throw new MembersException("Você não pode solicitar novamente. Aguarde 30 dias desde a última rejeição.");
                    }
                    // Atualizar enrollment existente para PENDING
                    enrollment.setStatus(EnrollmentStatus.PENDING);
                    enrollment.setRequestedAt(LocalDateTime.now());
                    enrollment.setRejectedAt(null);
                    enrollment.setRejectionReason(null);
                } else if (enrollment.getStatus() == EnrollmentStatus.PENDING) {
                    throw new MembersException("Já existe uma solicitação pendente para este grupo.");
                } else if (enrollment.getStatus() == EnrollmentStatus.APPROVED) {
                    throw new MembersException("Você já faz parte deste grupo.");
                }
                
                GroupEnrollment saved = enrollmentRepository.save(enrollment);
                return new GroupEnrollmentDTO(saved);
            } else {
                // Criar novo enrollment PENDING
                GroupEnrollment enrollment = new GroupEnrollment();
                enrollment.setMember(member);
                enrollment.setGroup(group);
                enrollment.setStatus(EnrollmentStatus.PENDING);
                enrollment.setRequestedAt(LocalDateTime.now());
                
                GroupEnrollment saved = enrollmentRepository.save(enrollment);
                log.info("Enrollment created with ID: {}", saved.getId());
                return new GroupEnrollmentDTO(saved);
            }
        } catch (MembersException e) {
            throw e;
        } catch (Exception e) {
            log.error("Error requesting enrollment", e);
            throw new MembersException("Erro ao solicitar participação no grupo: " + e.getMessage(), e);
        }
    }

    @Transactional
    public GroupEnrollmentDTO approveEnrollment(Long enrollmentId, String processedBy) {
        try {
            log.info("Approving enrollment ID: {} by user: {}", enrollmentId, processedBy);
            
            GroupEnrollment enrollment = enrollmentRepository.findById(enrollmentId)
                    .orElseThrow(() -> new MembersException("Enrollment not found with ID: " + enrollmentId));
            
            if (enrollment.getStatus() != EnrollmentStatus.PENDING) {
                throw new MembersException("Apenas solicitações pendentes podem ser aprovadas.");
            }
            
            enrollment.setStatus(EnrollmentStatus.APPROVED);
            enrollment.setProcessedAt(LocalDateTime.now());
            enrollment.setProcessedBy(processedBy);
            
            GroupEnrollment saved = enrollmentRepository.save(enrollment);
            log.info("Enrollment approved: {}", enrollmentId);
            return new GroupEnrollmentDTO(saved);
        } catch (MembersException e) {
            throw e;
        } catch (Exception e) {
            log.error("Error approving enrollment", e);
            throw new MembersException("Erro ao aprovar solicitação: " + e.getMessage(), e);
        }
    }

    @Transactional
    public GroupEnrollmentDTO rejectEnrollment(Long enrollmentId, RejectEnrollmentDTO dto, String rejectedBy) {
        try {
            log.info("Rejecting enrollment ID: {} by user: {}", enrollmentId, rejectedBy);
            
            GroupEnrollment enrollment = enrollmentRepository.findById(enrollmentId)
                    .orElseThrow(() -> new MembersException("Enrollment not found with ID: " + enrollmentId));
            
            if (enrollment.getStatus() != EnrollmentStatus.PENDING) {
                throw new MembersException("Apenas solicitações pendentes podem ser rejeitadas.");
            }
            
            enrollment.setStatus(EnrollmentStatus.REJECTED);
            enrollment.setRejectedAt(LocalDateTime.now());
            enrollment.setProcessedAt(LocalDateTime.now());
            enrollment.setRejectedBy(rejectedBy);
            
            if (dto.getJustifyRejection() != null && dto.getJustifyRejection() && dto.getRejectionReason() != null) {
                enrollment.setRejectionReason(dto.getRejectionReason().trim());
            }
            
            GroupEnrollment saved = enrollmentRepository.save(enrollment);
            log.info("Enrollment rejected: {}", enrollmentId);
            return new GroupEnrollmentDTO(saved);
        } catch (MembersException e) {
            throw e;
        } catch (Exception e) {
            log.error("Error rejecting enrollment", e);
            throw new MembersException("Erro ao rejeitar solicitação: " + e.getMessage(), e);
        }
    }

    @Transactional
    public void removeEnrollment(Long enrollmentId) {
        try {
            log.info("Removing enrollment ID: {}", enrollmentId);
            
            if (!enrollmentRepository.existsById(enrollmentId)) {
                throw new MembersException("Enrollment not found with ID: " + enrollmentId);
            }
            
            enrollmentRepository.deleteById(enrollmentId);
            log.info("Enrollment removed successfully: {}", enrollmentId);
        } catch (MembersException e) {
            throw e;
        } catch (Exception e) {
            log.error("Error removing enrollment", e);
            throw new MembersException("Erro ao remover participação: " + e.getMessage(), e);
        }
    }

    public List<GroupEnrollmentDTO> getPendingEnrollments() {
        try {
            log.info("Getting pending enrollments");
            List<GroupEnrollment> enrollments = enrollmentRepository.findPendingEnrollments(EnrollmentStatus.PENDING);
            log.info("Found {} pending enrollments", enrollments.size());
            List<GroupEnrollmentDTO> dtos = enrollments.stream()
                    .map(GroupEnrollmentDTO::new)
                    .collect(Collectors.toList());
            log.info("Converted to {} DTOs", dtos.size());
            return dtos;
        } catch (Exception e) {
            log.error("Error getting pending enrollments", e);
            throw new MembersException("Erro ao buscar solicitações pendentes: " + e.getMessage(), e);
        }
    }

    public List<GroupEnrollmentDTO> getMemberEnrollments(Long memberId) {
        try {
            log.info("Getting enrollments for member ID: {}", memberId);
            return enrollmentRepository.findByMemberId(memberId).stream()
                    .map(GroupEnrollmentDTO::new)
                    .collect(Collectors.toList());
        } catch (Exception e) {
            log.error("Error getting member enrollments", e);
            throw new MembersException("Erro ao buscar participações do membro: " + e.getMessage(), e);
        }
    }

    public List<GroupEnrollmentDTO> getAllProcessedEnrollments() {
        try {
            log.info("Getting all processed enrollments (history)");
            List<GroupEnrollment> enrollments = enrollmentRepository.findAllProcessedEnrollments();
            log.info("Found {} processed enrollments", enrollments.size());
            return enrollments.stream()
                    .map(GroupEnrollmentDTO::new)
                    .collect(Collectors.toList());
        } catch (Exception e) {
            log.error("Error getting processed enrollments", e);
            throw new MembersException("Erro ao buscar histórico de aprovações: " + e.getMessage(), e);
        }
    }

    public List<MemberDTO> getGroupMembers(Long groupId) {
        try {
            log.info("Getting members for group ID: {}", groupId);
            List<GroupEnrollment> enrollments = enrollmentRepository.findApprovedByGroupId(groupId);
            return enrollments.stream()
                    .map(enrollment -> new MemberDTO(enrollment.getMember()))
                    .collect(Collectors.toList());
        } catch (Exception e) {
            log.error("Error getting group members", e);
            throw new MembersException("Erro ao buscar membros do grupo: " + e.getMessage(), e);
        }
    }

    public boolean canRequestAgain(Long memberId, Long groupId) {
        try {
            var lastRejected = enrollmentRepository.findLastRejected(memberId, groupId);
            
            if (lastRejected.isEmpty()) {
                return true;
            }
            
            GroupEnrollment rejected = lastRejected.get();
            if (rejected.getRejectedAt() == null) {
                return true;
            }
            
            LocalDateTime thirtyDaysLater = rejected.getRejectedAt().plusDays(30);
            return LocalDateTime.now().isAfter(thirtyDaysLater);
        } catch (Exception e) {
            log.error("Error checking if can request again", e);
            return false;
        }
    }

    @Transactional
    public GroupEnrollmentDTO createDirectApproval(Long memberId, Long groupId, String processedBy) {
        try {
            log.info("Creating direct approval for member ID: {} in group ID: {}", memberId, groupId);
            
            MemberEntity member = memberRepository.findById(memberId)
                    .orElseThrow(() -> new MembersException("Member not found with ID: " + memberId));
            
            GroupEntity group = groupRepository.findById(groupId)
                    .orElseThrow(() -> new MembersException("Group not found with ID: " + groupId));

            // Verificar se já existe (pode haver duplicatas)
            List<GroupEnrollment> existingList = enrollmentRepository.findByMemberIdAndGroupIdList(memberId, groupId);
            
            // Se houver duplicatas, limpar e manter apenas uma
            if (!existingList.isEmpty()) {
                // Verificar se já existe um APPROVED
                GroupEnrollment approvedEnrollment = existingList.stream()
                        .filter(e -> e.getStatus() == EnrollmentStatus.APPROVED)
                        .findFirst()
                        .orElse(null);
                
                if (approvedEnrollment != null) {
                    throw new MembersException("Membro já faz parte deste grupo.");
                }
                
                // Se houver múltiplos registros, deletar duplicatas e manter apenas o mais recente
                if (existingList.size() > 1) {
                    log.warn("Found {} duplicate enrollments for member {} and group {}. Cleaning up...", 
                            existingList.size(), memberId, groupId);
                    // Ordenar por ID (mais recente primeiro) e manter apenas o primeiro
                    existingList.sort((a, b) -> Long.compare(b.getId(), a.getId()));
                    // Deletar todos exceto o primeiro
                    for (int i = 1; i < existingList.size(); i++) {
                        enrollmentRepository.delete(existingList.get(i));
                        log.info("Deleted duplicate enrollment ID: {}", existingList.get(i).getId());
                    }
                }
                
                // Atualizar o registro restante para APPROVED
                GroupEnrollment enrollment = existingList.get(0);
                enrollment.setStatus(EnrollmentStatus.APPROVED);
                enrollment.setRequestedAt(LocalDateTime.now());
                enrollment.setProcessedAt(LocalDateTime.now());
                enrollment.setRejectedAt(null);
                enrollment.setRejectionReason(null);
                enrollment.setProcessedBy(processedBy);
                GroupEnrollment saved = enrollmentRepository.save(enrollment);
                log.info("Updated existing enrollment to APPROVED: {}", saved.getId());
                return new GroupEnrollmentDTO(saved);
            } else {
                // Criar novo APPROVED
                GroupEnrollment enrollment = new GroupEnrollment();
                enrollment.setMember(member);
                enrollment.setGroup(group);
                enrollment.setStatus(EnrollmentStatus.APPROVED);
                LocalDateTime now = LocalDateTime.now();
                enrollment.setRequestedAt(now);
                enrollment.setProcessedAt(now);
                enrollment.setProcessedBy(processedBy);
                
                GroupEnrollment saved = enrollmentRepository.save(enrollment);
                log.info("Direct approval created with ID: {}", saved.getId());
                return new GroupEnrollmentDTO(saved);
            }
        } catch (MembersException e) {
            throw e;
        } catch (Exception e) {
            log.error("Error creating direct approval", e);
            throw new MembersException("Erro ao adicionar membro ao grupo: " + e.getMessage(), e);
        }
    }
}

