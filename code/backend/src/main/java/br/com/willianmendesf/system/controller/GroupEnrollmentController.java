package br.com.willianmendesf.system.controller;

import br.com.willianmendesf.system.exception.MembersException;
import br.com.willianmendesf.system.model.dto.GroupEnrollmentDTO;
import br.com.willianmendesf.system.model.dto.MemberDTO;
import br.com.willianmendesf.system.model.dto.RejectEnrollmentDTO;
import br.com.willianmendesf.system.service.GroupEnrollmentService;
import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/enrollments")
@AllArgsConstructor
@Slf4j
public class GroupEnrollmentController {

    private final GroupEnrollmentService enrollmentService;

    @PostMapping("/request")
    public ResponseEntity<GroupEnrollmentDTO> requestEnrollment(
            @RequestParam Long memberId,
            @RequestParam Long groupId) {
        try {
            GroupEnrollmentDTO enrollment = enrollmentService.requestEnrollment(memberId, groupId);
            return ResponseEntity.ok(enrollment);
        } catch (Exception e) {
            log.error("Error requesting enrollment", e);
            return ResponseEntity.badRequest().build();
        }
    }

    @PostMapping("/{id}/approve")
    @PreAuthorize("hasAuthority('WRITE_MEMBERS')")
    public ResponseEntity<GroupEnrollmentDTO> approveEnrollment(@PathVariable Long id) {
        try {
            GroupEnrollmentDTO enrollment = enrollmentService.approveEnrollment(id);
            return ResponseEntity.ok(enrollment);
        } catch (Exception e) {
            log.error("Error approving enrollment", e);
            return ResponseEntity.badRequest().build();
        }
    }

    @PostMapping("/{id}/reject")
    @PreAuthorize("hasAuthority('WRITE_MEMBERS')")
    public ResponseEntity<GroupEnrollmentDTO> rejectEnrollment(
            @PathVariable Long id,
            @RequestBody RejectEnrollmentDTO dto) {
        try {
            GroupEnrollmentDTO enrollment = enrollmentService.rejectEnrollment(id, dto);
            return ResponseEntity.ok(enrollment);
        } catch (Exception e) {
            log.error("Error rejecting enrollment", e);
            return ResponseEntity.badRequest().build();
        }
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAuthority('WRITE_MEMBERS')")
    public ResponseEntity<Void> removeEnrollment(@PathVariable Long id) {
        try {
            log.info("Removing enrollment with ID: {}", id);
            enrollmentService.removeEnrollment(id);
            return ResponseEntity.ok().build();
        } catch (MembersException e) {
            log.error("Error removing enrollment: {}", e.getMessage());
            return ResponseEntity.notFound().build();
        } catch (Exception e) {
            log.error("Error removing enrollment", e);
            return ResponseEntity.badRequest().build();
        }
    }

    @GetMapping("/pending")
    @PreAuthorize("hasAuthority('READ_MEMBERS')")
    public ResponseEntity<List<GroupEnrollmentDTO>> getPendingEnrollments() {
        try {
            log.info("GET /pending - Request received");
            List<GroupEnrollmentDTO> enrollments = enrollmentService.getPendingEnrollments();
            log.info("GET /pending - Returning {} enrollments", enrollments.size());
            return ResponseEntity.ok(enrollments);
        } catch (MembersException e) {
            log.error("Error getting pending enrollments: {}", e.getMessage());
            return ResponseEntity.badRequest().build();
        } catch (Exception e) {
            log.error("Error getting pending enrollments", e);
            return ResponseEntity.badRequest().build();
        }
    }

    @GetMapping("/member/{memberId}")
    public ResponseEntity<List<GroupEnrollmentDTO>> getMemberEnrollments(@PathVariable Long memberId) {
        try {
            List<GroupEnrollmentDTO> enrollments = enrollmentService.getMemberEnrollments(memberId);
            return ResponseEntity.ok(enrollments);
        } catch (Exception e) {
            log.error("Error getting member enrollments", e);
            return ResponseEntity.badRequest().build();
        }
    }

    @GetMapping("/group/{groupId}")
    @PreAuthorize("hasAuthority('READ_MEMBERS')")
    public ResponseEntity<List<MemberDTO>> getGroupMembers(@PathVariable Long groupId) {
        try {
            List<MemberDTO> members = enrollmentService.getGroupMembers(groupId);
            return ResponseEntity.ok(members);
        } catch (Exception e) {
            log.error("Error getting group members", e);
            return ResponseEntity.badRequest().build();
        }
    }

    @GetMapping("/can-request/{memberId}/{groupId}")
    public ResponseEntity<Boolean> canRequestAgain(
            @PathVariable Long memberId,
            @PathVariable Long groupId) {
        try {
            boolean canRequest = enrollmentService.canRequestAgain(memberId, groupId);
            return ResponseEntity.ok(canRequest);
        } catch (Exception e) {
            log.error("Error checking if can request again", e);
            return ResponseEntity.ok(false);
        }
    }

    @PostMapping("/direct-approval")
    @PreAuthorize("hasAuthority('WRITE_MEMBERS')")
    public ResponseEntity<GroupEnrollmentDTO> createDirectApproval(
            @RequestParam Long memberId,
            @RequestParam Long groupId) {
        try {
            GroupEnrollmentDTO enrollment = enrollmentService.createDirectApproval(memberId, groupId);
            return ResponseEntity.ok(enrollment);
        } catch (Exception e) {
            log.error("Error creating direct approval", e);
            return ResponseEntity.badRequest().build();
        }
    }
}

