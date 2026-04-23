package com.jobportal.dto;

import java.time.LocalDateTime;

import com.jobportal.entity.Notification;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class NotificationDTO {
    private Long id;
    private Long userId;
    private String message;
    private String action;
    private String route;
    private NotificationStatus status;
    private LocalDateTime timestamp;

    private LocalDateTime createdAt;
    private Long createdBy;
    private LocalDateTime updatedAt;
    private Long updatedBy;

    public Notification toEntity() {
        Notification notification = new Notification();
        notification.setId(this.id);
        notification.setUserId(this.userId);
        notification.setMessage(this.message);
        notification.setAction(this.action);
        notification.setRoute(this.route);
        notification.setStatus(this.status);
        notification.setTimestamp(this.timestamp);
        return notification;
    }
}
