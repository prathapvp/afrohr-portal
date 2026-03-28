package com.afrohr.portal.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "candidate_profiles")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CandidateProfile {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false, unique = true)
    private User user;

    @Column(columnDefinition = "TEXT")
    private String bio;

    private String phone;

    private String location;

    private String linkedinUrl;

    private String portfolioUrl;

    @Column(columnDefinition = "TEXT")
    private String skills;   // comma-separated or JSON array string

    // Resume file path / S3 key stored after upload
    private String resumePath;

    private String resumeOriginalFilename;

    @Enumerated(EnumType.STRING)
    private ProfileVisibility visibility = ProfileVisibility.PRIVATE;

    @Column(updatable = false)
    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    public enum ProfileVisibility {
        PUBLIC, PRIVATE
    }
}
