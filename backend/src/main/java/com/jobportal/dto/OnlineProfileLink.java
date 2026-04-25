package com.jobportal.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class OnlineProfileLink {
    @NotBlank(message = "profile.onlineProfile.platform.required")
    @Size(max = 80, message = "profile.onlineProfile.platform.max")
    private String platform;

    @NotBlank(message = "profile.onlineProfile.url.required")
    @Size(max = 400, message = "profile.onlineProfile.url.max")
    private String url;
}