package com.jobportal.dto;

import java.time.LocalDateTime;
import java.util.List;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class AdminOverviewDTO {
    private long activeEmployers;
    private long activeCandidates;
    private long activeStudents;
    private long totalUsers;
    private long totalProfiles;
    private long totalJobs;
    private long activeJobs;
    private long employerSubscriptionsConfigured;
    private long employerSubscriptionsPending;
    private LocalDateTime generatedAt;
    private List<AdminEmployerSummaryDTO> employers;
}
