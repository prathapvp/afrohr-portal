package com.jobportal.dto;

import java.time.LocalDateTime;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class UpsertEmployerSubscriptionRequest {
    @NotBlank(message = "{subscription.plan.required}")
    private String planName;

    @NotNull(message = "{subscription.status.required}")
    private SubscriptionStatus subscriptionStatus;

    @NotNull(message = "{subscription.paymentStatus.required}")
    private PaymentStatus paymentStatus;

    @Positive(message = "{subscription.durationDays.invalid}")
    private Integer durationDays;

    private LocalDateTime startAt;

    private LocalDateTime endAt;

    @Positive(message = "{subscription.maxActiveJobs.invalid}")
    private Integer maxActiveJobs;
}
