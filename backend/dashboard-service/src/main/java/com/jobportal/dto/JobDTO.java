package com.jobportal.dto;

import java.time.LocalDateTime;
import java.util.List;

import com.jobportal.entity.Job;

import jakarta.validation.Valid;
import jakarta.validation.constraints.AssertTrue;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.PositiveOrZero;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class JobDTO {
    private Long id;
    private String jobCode;

    @NotBlank(message = "{job.title.required}")
    @Size(max = 200, message = "{job.title.max}")
    private String jobTitle;

    @Size(max = 120, message = "{job.department.max}")
    private String department;

    @Size(max = 120, message = "{job.role.max}")
    private String role;

    @NotBlank(message = "{job.company.required}")
    @Size(max = 200, message = "{job.company.max}")
    private String company;

    @Valid
    private List<ApplicantDTO> applicants;

    @Size(max = 2000, message = "{job.about.max}")
    private String about;

    @Size(max = 50, message = "{job.experience.max}")
    private String experience;

    private boolean freshersAllowed;

    @NotBlank(message = "{job.jobType.required}")
    @Size(max = 50, message = "{job.jobType.max}")
    private String jobType;

    @NotBlank(message = "{job.location.required}")
    @Size(max = 200, message = "{job.location.max}")
    private String location;

    @Size(max = 80, message = "{job.country.max}")
    private String country;

    @NotBlank(message = "{job.currency.required}")
    @Size(max = 10, message = "{job.currency.max}")
    private String currency;

    @Positive(message = "{job.package.min.positive}")
    private Long packageOffered;

    @Positive(message = "{job.package.max.positive}")
    private Long maxPackageOffered;

    @PositiveOrZero(message = "{job.variableComponent.invalid}")
    private Integer variableComponent;

    private boolean hideSalary;

    @Size(max = 50, message = "{job.workMode.max}")
    private String workMode;

    private boolean willingToRelocate;

    @Size(max = 120, message = "{job.industry.max}")
    private String industry;

    @Positive(message = "{job.vacancies.positive}")
    private Integer vacancies;
    private LocalDateTime postTime;

    @NotBlank(message = "{job.description.required}")
    @Size(max = 8000, message = "{job.description.max}")
    private String description;

    @NotEmpty(message = "{job.skills.required}")
    private List<@Size(max = 80, message = "{job.skill.item.max}") String> skillsRequired;

    @NotNull(message = "{job.status.required}")
    private JobStatus jobStatus;

    @NotNull(message = "{job.postedBy.required}")
    private Long postedBy;

    private LocalDateTime createdAt;
    private Long createdBy;
    private LocalDateTime updatedAt;
    private Long updatedBy;

    @AssertTrue(message = "{job.salary.range.invalid}")
    public boolean isSalaryRangeValid() {
        if (packageOffered == null || maxPackageOffered == null) {
            return true;
        }
        return maxPackageOffered >= packageOffered;
    }

    public Job toEntity() {
        Job job = new Job();
        job.setId(this.id);
        job.setJobCode(this.jobCode);
        job.setJobTitle(this.jobTitle);
        job.setDepartment(this.department);
        job.setRole(this.role);
        job.setCompany(this.company);
        job.setApplicants(this.applicants != null ? this.applicants.stream().map(ApplicantDTO::toEntity).toList() : null);
        job.setAbout(this.about);
        job.setExperience(this.experience);
        job.setFreshersAllowed(this.freshersAllowed);
        job.setJobType(this.jobType);
        job.setLocation(this.location);
        job.setCountry(this.country);
        job.setCurrency(this.currency);
        job.setPackageOffered(this.packageOffered);
        job.setMaxPackageOffered(this.maxPackageOffered);
        job.setVariableComponent(this.variableComponent);
        job.setHideSalary(this.hideSalary);
        job.setWorkMode(this.workMode);
        job.setWillingToRelocate(this.willingToRelocate);
        job.setIndustry(this.industry);
        job.setVacancies(this.vacancies);
        job.setPostTime(this.postTime);
        job.setDescription(this.description);
        job.setSkillsRequired(this.skillsRequired);
        job.setJobStatus(this.jobStatus);
        job.setPostedBy(this.postedBy);
        return job;
    }
}
