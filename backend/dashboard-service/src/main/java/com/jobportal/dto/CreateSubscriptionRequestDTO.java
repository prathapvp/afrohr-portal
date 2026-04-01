package com.jobportal.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class CreateSubscriptionRequestDTO {

    @NotNull(message = "{subscription.request.type.required}")
    private SubscriptionRequestType requestType;

    @Size(max = 500, message = "{subscription.request.note.size}")
    private String note;
}
