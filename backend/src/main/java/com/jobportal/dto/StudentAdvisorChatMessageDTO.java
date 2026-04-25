package com.jobportal.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public class StudentAdvisorChatMessageDTO {

    @NotBlank(message = "{student.chat.role.required}")
    @Size(max = 20, message = "{student.chat.role.max}")
    private String role;

    @NotBlank(message = "{student.chat.content.required}")
    @Size(max = 1000, message = "{student.chat.content.max}")
    private String content;

    public String getRole() {
        return role;
    }

    public void setRole(String role) {
        this.role = role;
    }

    public String getContent() {
        return content;
    }

    public void setContent(String content) {
        this.content = content;
    }
}