package com.jobportal.entity;

import java.time.LocalDateTime;

import com.jobportal.dto.AccountType;
import com.jobportal.dto.EmployerRole;
import com.jobportal.dto.UserDTO;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "users")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class User {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String name;

    @Column(unique = true)
    private String email;

    private String password;

    @Enumerated(EnumType.STRING)
    private AccountType accountType;

    @Enumerated(EnumType.STRING)
    private EmployerRole employerRole;

    private Long profileId;

    @Column(nullable = false)
    private LocalDateTime createdAt;

    private Long createdBy;

    @Column(nullable = false)
    private LocalDateTime updatedAt;

    private Long updatedBy;

    @PrePersist
    void onCreate() {
        LocalDateTime now = LocalDateTime.now();
        this.createdAt = now;
        this.updatedAt = now;
    }

    @PreUpdate
    void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }

    public UserDTO toDTO() {
        UserDTO dto = new UserDTO();
        dto.setId(this.id);
        dto.setName(this.name);
        dto.setEmail(this.email);
        dto.setPassword(null);
        dto.setAccountType(this.accountType);
        dto.setEmployerRole(this.employerRole);
        dto.setProfileId(this.profileId);
        dto.setCreatedAt(this.createdAt);
        dto.setCreatedBy(this.createdBy);
        dto.setUpdatedAt(this.updatedAt);
        dto.setUpdatedBy(this.updatedBy);
        return dto;
    }
}
