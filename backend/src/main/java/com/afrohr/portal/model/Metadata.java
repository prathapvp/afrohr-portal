package com.afrohr.portal.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

/**
 * Generic metadata / lookup-table entity.
 * Used to manage configurable values such as industries, skill tags,
 * employment types, and experience levels without code changes.
 */
@Entity
@Table(name = "metadata",
        uniqueConstraints = @UniqueConstraint(columnNames = {"category", "value"}))
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Metadata {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String category;   // e.g. "INDUSTRY", "SKILL_TAG", "EMPLOYMENT_TYPE"

    @Column(nullable = false)
    private String value;

    private String label;

    private Integer sortOrder;

    private boolean active = true;

    @Column(updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }
}
