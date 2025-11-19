package br.com.willianmendesf.system.model.dto;

import br.com.willianmendesf.system.model.entity.GroupEnrollment;
import lombok.AllArgsConstructor;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@AllArgsConstructor
public class GroupEnrollmentDTO {
    private Long id;
    private Long memberId;
    private String memberName;
    private String memberFotoUrl;
    private String memberCelular;
    private Long groupId;
    private String groupName;
    private String status;
    private LocalDateTime requestedAt;
    private LocalDateTime processedAt;
    private String rejectionReason;
    private LocalDateTime rejectedAt;

    public GroupEnrollmentDTO(GroupEnrollment enrollment) {
        this.id = enrollment.getId();
        this.memberId = enrollment.getMember().getId();
        this.memberName = enrollment.getMember().getNome();
        this.memberFotoUrl = enrollment.getMember().getFotoUrl();
        this.memberCelular = enrollment.getMember().getCelular();
        this.groupId = enrollment.getGroup().getId();
        this.groupName = enrollment.getGroup().getNome();
        this.status = enrollment.getStatus().name();
        this.requestedAt = enrollment.getRequestedAt();
        this.processedAt = enrollment.getProcessedAt();
        this.rejectionReason = enrollment.getRejectionReason();
        this.rejectedAt = enrollment.getRejectedAt();
    }
}

