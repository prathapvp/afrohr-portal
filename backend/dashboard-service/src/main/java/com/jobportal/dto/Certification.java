package com.jobportal.dto;

import java.time.LocalDateTime;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class Certification {
    @NotBlank(message = "{certification.name.required}")
    @Size(max = 200, message = "{certification.name.max}")
    private String name;

    @Size(max = 200, message = "{certification.issuer.max}")
    private String issuer;

    @NotNull(message = "{certification.issueDate.required}")
    private LocalDateTime issueDate;

    @Size(max = 120, message = "{certification.certificateId.max}")
    private String certificateId;
}
