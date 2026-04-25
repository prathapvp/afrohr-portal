package com.jobportal.dto;

import java.time.LocalDateTime;

import jakarta.validation.constraints.AssertTrue;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class Experience {
    @NotBlank(message = "{experience.title.required}")
    @Size(max = 120, message = "{experience.title.max}")
    private String title;

    @NotBlank(message = "{experience.company.required}")
    @Size(max = 200, message = "{experience.company.max}")
    private String company;

    @Size(max = 200, message = "{experience.location.max}")
    private String location;

    @NotNull(message = "{experience.startDate.required}")
    private LocalDateTime startDate;
    private LocalDateTime endDate;
    private Boolean working;
    @Size(max = 2000, message = "{experience.description.max}")
    private String description;

    @AssertTrue(message = "{experience.endDate.invalid}")
    public boolean isEndDateValid() {
        if (Boolean.TRUE.equals(working) || endDate == null || startDate == null) {
            return true;
        }
        return endDate.isAfter(startDate) || endDate.isEqual(startDate);
    }
}
