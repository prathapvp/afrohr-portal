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

    public JobDTO toDTO() {
        return new JobDTO(
            this.id, this.jobCode, this.jobTitle, this.department, this.role, this.company,
            this.applicants != null ? this.applicants.stream().map(Applicant::toDTO).toList() : null,
            this.about, this.experience, this.freshersAllowed, this.jobType,
            this.location, this.country, this.currency, this.packageOffered, this.maxPackageOffered, this.variableComponent,
            this.hideSalary, this.workMode, this.willingToRelocate, this.industry,
            this.vacancies, this.postTime, this.description, this.skillsRequired,
            this.jobStatus, this.postedBy
        );
    }
}
