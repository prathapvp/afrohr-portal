package com.jobportal.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class ResolveSubscriptionRequestDTO {

    @NotNull(message = "{subscription.request.resolution.required}")
    private SubscriptionRequestStatus resolution;

    @Size(max = 500, message = "{subscription.request.note.size}")
    private String adminNote;
}
