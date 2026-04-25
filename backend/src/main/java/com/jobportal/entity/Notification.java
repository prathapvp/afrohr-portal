package com.jobportal.entity;

import java.time.LocalDateTime;

import com.jobportal.dto.NotificationDTO;
import com.jobportal.dto.NotificationStatus;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "notifications")
public class Notification {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long userId;
    private String message;
    private String action;
    private String route;

    @Enumerated(EnumType.STRING)
    private NotificationStatus status;

    private LocalDateTime timestamp;

    @Column(nullable = false)
    private LocalDateTime createdAt;

    private Long createdBy;

    @Column(nullable = false)
    private LocalDateTime updatedAt;

    private Long updatedBy;

    @PrePersist
    void onCreate() {
        LocalDateTime now = LocalDateTime.now();
        if (this.timestamp == null) {
            this.timestamp = now;
        }
        this.createdAt = now;
        this.updatedAt = now;
    }

    @PreUpdate
    void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }

    public NotificationDTO toDTO() {
        NotificationDTO dto = new NotificationDTO();
        dto.setId(this.id);
        dto.setUserId(this.userId);
        dto.setMessage(this.message);
        dto.setAction(this.action);
        dto.setRoute(this.route);
        dto.setStatus(this.status);
        dto.setTimestamp(this.timestamp);
        dto.setCreatedAt(this.createdAt);
        dto.setCreatedBy(this.createdBy);
        dto.setUpdatedAt(this.updatedAt);
        dto.setUpdatedBy(this.updatedBy);
        return dto;
    }
}
