package com.jobportal.entity;

import java.time.LocalDateTime;

import com.jobportal.dto.SubscriptionRequestStatus;
import com.jobportal.dto.SubscriptionRequestType;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "subscription_requests")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class SubscriptionRequest {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long employerId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private SubscriptionRequestType requestType;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private SubscriptionRequestStatus status;

    @Column(length = 500)
    private String note;

    @Column(length = 500)
    private String adminNote;

    @Column(nullable = false)
    private LocalDateTime createdAt;

    @Column
    private LocalDateTime resolvedAt;

    @PrePersist
    protected void prePersist() {
        this.createdAt = LocalDateTime.now();
        if (this.status == null) {
            this.status = SubscriptionRequestStatus.PENDING;
        }
    }
}
