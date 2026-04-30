package com.jobportal.dto;

import java.time.LocalDateTime;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class AdminProfileCompletionDTO {
    private Long userId;
    private String name;
    private String email;
    private String accountType;
    private Integer profileCompletionPercent;
    private LocalDateTime lastActiveAt;
}