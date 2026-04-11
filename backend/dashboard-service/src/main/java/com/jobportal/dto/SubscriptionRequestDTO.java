package com.jobportal.dto;

import java.time.LocalDateTime;

import com.jobportal.entity.SubscriptionRequest;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class SubscriptionRequestDTO {
    private Long id;
    private Long employerId;
    private SubscriptionRequestType requestType;
    private SubscriptionRequestStatus status;
    private String requestedPlan;
    private String note;
    private String adminNote;
    private boolean hasPaymentStatement;
    private String paymentStatementName;
    private LocalDateTime createdAt;
    private LocalDateTime resolvedAt;

    public static SubscriptionRequestDTO fromEntity(SubscriptionRequest entity) {
        return new SubscriptionRequestDTO(
                entity.getId(),
                entity.getEmployerId(),
                entity.getRequestType(),
                entity.getStatus(),
                entity.getRequestedPlan(),
                entity.getNote(),
                entity.getAdminNote(),
                entity.getPaymentStatement() != null && entity.getPaymentStatement().length > 0,
                entity.getPaymentStatementName(),
                entity.getCreatedAt(),
                entity.getResolvedAt());
    }
}
