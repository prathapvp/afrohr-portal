package com.jobportal.entity;

import java.time.LocalDateTime;
import java.util.List;

import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import com.jobportal.dto.JobDTO;
import com.jobportal.dto.JobStatus;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "jobs")
public class Job {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "job_code", length = 40)
    private String jobCode;

    private String jobTitle;
    private String department;
    private String role;
    private String company;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(columnDefinition = "jsonb")
    private List<Applicant> applicants;

    @Column(length = 2000)
    private String about;

    private String experience;
    private boolean freshersAllowed;
    private String jobType;
    private String location;
    private String country;
    private String currency;
    private Long packageOffered;
    private Long maxPackageOffered;
    private Integer variableComponent;
    private boolean hideSalary;
    private String workMode;
    private boolean willingToRelocate;
    private String industry;
    private Integer vacancies;
    private LocalDateTime postTime;

    @Column(length = 8000)
    private String description;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(columnDefinition = "jsonb")
    private List<String> skillsRequired;

    @Enumerated(EnumType.STRING)
    private JobStatus jobStatus;

    private Long postedBy;

    @Column(nullable = false)
    private LocalDateTime createdAt;

    private Long createdBy;

    @Column(nullable = false)
    private LocalDateTime updatedAt;

    private Long updatedBy;

    @PrePersist
    void onCreate() {
        LocalDateTime now = LocalDateTime.now();
        if (this.postTime == null) {
            this.postTime = now;
        }
        this.createdAt = now;
        this.updatedAt = now;
    }

    @PreUpdate
    void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }

    public JobDTO toDTO() {
        JobDTO dto = new JobDTO();
        dto.setId(this.id);
        dto.setJobCode(this.jobCode);
        dto.setJobTitle(this.jobTitle);
        dto.setDepartment(this.department);
        dto.setRole(this.role);
        dto.setCompany(this.company);
        dto.setApplicants(this.applicants != null ? this.applicants.stream().map(Applicant::toDTO).toList() : null);
        dto.setAbout(this.about);
        dto.setExperience(this.experience);
        dto.setFreshersAllowed(this.freshersAllowed);
        dto.setJobType(this.jobType);
        dto.setLocation(this.location);
        dto.setCountry(this.country);
        dto.setCurrency(this.currency);
        dto.setPackageOffered(this.packageOffered);
        dto.setMaxPackageOffered(this.maxPackageOffered);
        dto.setVariableComponent(this.variableComponent);
        dto.setHideSalary(this.hideSalary);
        dto.setWorkMode(this.workMode);
        dto.setWillingToRelocate(this.willingToRelocate);
        dto.setIndustry(this.industry);
        dto.setVacancies(this.vacancies);
        dto.setPostTime(this.postTime);
        dto.setDescription(this.description);
        dto.setSkillsRequired(this.skillsRequired);
        dto.setJobStatus(this.jobStatus);
        dto.setPostedBy(this.postedBy);
        dto.setCreatedAt(this.createdAt);
        dto.setCreatedBy(this.createdBy);
        dto.setUpdatedAt(this.updatedAt);
        dto.setUpdatedBy(this.updatedBy);
        return dto;
    }
}
