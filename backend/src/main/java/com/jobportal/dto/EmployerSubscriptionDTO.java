package com.jobportal.dto;

import java.time.LocalDateTime;

import com.jobportal.entity.EmployerSubscription;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class EmployerSubscriptionDTO {
    private Long id;
    private Long employerId;
    private String planName;
    private SubscriptionStatus subscriptionStatus;
    private PaymentStatus paymentStatus;
    private LocalDateTime startAt;
    private LocalDateTime endAt;
    private Integer maxActiveJobs;
    private Integer maxResumeViewsPerMonth;
    private Integer maxResumeDownloadsPerMonth;
    private Integer monthlyResumeViewsUsed;
    private Integer monthlyResumeDownloadsUsed;
    private LocalDateTime usageWindowStartAt;
    private Integer activeJobs;
    private boolean postingAllowed;
    private long remainingDays;

    public static EmployerSubscriptionDTO fromEntity(EmployerSubscription entity, int activeJobs, boolean postingAllowed, long remainingDays) {
        return new EmployerSubscriptionDTO(
                entity.getId(),
                entity.getEmployerId(),
                entity.getPlanName(),
                entity.getSubscriptionStatus(),
                entity.getPaymentStatus(),
                entity.getStartAt(),
                entity.getEndAt(),
                entity.getMaxActiveJobs(),
                entity.getMaxResumeViewsPerMonth(),
                entity.getMaxResumeDownloadsPerMonth(),
                entity.getMonthlyResumeViewsUsed(),
                entity.getMonthlyResumeDownloadsUsed(),
                entity.getUsageWindowStartAt(),
                activeJobs,
                postingAllowed,
                remainingDays);
    }
}
