package br.com.willianmendesf.system.model.dto;

import lombok.Data;

@Data
public class RejectEnrollmentDTO {
    private Boolean justifyRejection;
    private String rejectionReason;
}

