package com.jobportal.dto;

import java.time.LocalDateTime;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class AdminEmployerSummaryDTO {
    private Long employerId;
    private String companyName;
    private String contactName;
    private String email;
    private String location;
    private String subscriptionPlan;
    private String subscriptionStatus;
    private Integer monthlyResumeViewsUsed;
    private Integer maxResumeViewsPerMonth;
    private Integer monthlyResumeDownloadsUsed;
    private Integer maxResumeDownloadsPerMonth;
    private LocalDateTime usageWindowStartAt;
}
