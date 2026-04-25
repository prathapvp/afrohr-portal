package com.jobportal.dto;

import java.time.LocalDateTime;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class Application {
    private Long id;
    @NotNull(message = "application.applicantId.required")
    private Long applicantId;
    private LocalDateTime interviewTime;
    @NotNull(message = "application.status.required")
    private ApplicationStatus applicationStatus;
    private String screeningOwner;
    private String interviewStatus;
    private Boolean offerSalaryBandConfirmed;
    private Boolean offerApprovalsDone;
    private Boolean offerStartDateConfirmed;
    private String rejectionReason;
}
