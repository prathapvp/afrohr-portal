package com.jobportal.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class WorkSample {
    @NotBlank(message = "profile.workSample.title.required")
    @Size(max = 160, message = "profile.workSample.title.max")
    private String title;

    @NotBlank(message = "profile.workSample.url.required")
    @Size(max = 400, message = "profile.workSample.url.max")
    private String url;

    @Size(max = 2000, message = "profile.workSample.description.max")
    private String description;
}