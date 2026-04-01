package com.jobportal.dto;

import java.time.LocalDateTime;
import java.util.Base64;

import com.jobportal.entity.Applicant;

import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class ApplicantDTO {
    private Long applicantId;
    @NotBlank(message = "{applicant.name.required}")
    @Size(max = 120, message = "{applicant.name.max}")
    private String name;

    @NotBlank(message = "{applicant.email.required}")
    @Email(message = "{applicant.email.invalid}")
    private String email;

    @NotNull(message = "{applicant.phone.required}")
    @Digits(integer = 15, fraction = 0, message = "{applicant.phone.invalid}")
    private Long phone;
    private String website;
    private String resume;
    @Size(max = 4000, message = "{applicant.coverLetter.max}")
    private String coverLetter;
    private LocalDateTime timestamp;
    @NotNull(message = "{applicant.applicationStatus.required}")
    private ApplicationStatus applicationStatus;
    private LocalDateTime interviewTime;

    public Applicant toEntity() {
        return new Applicant(
            this.getApplicantId(), this.getName(), this.getEmail(), this.getPhone(),
            this.getWebsite(),
            this.getResume() != null ? Base64.getDecoder().decode(this.getResume()) : null,
            this.getCoverLetter(), this.getTimestamp(), this.getApplicationStatus(), this.interviewTime
        );
    }
}
