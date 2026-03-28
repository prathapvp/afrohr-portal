package com.jobportal.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class LoginDTO {
    @NotBlank(message = "login.email.required")
    @Email(message = "login.email.invalid")
    private String email;

    @NotBlank(message = "login.password.required")
    @Size(min = 8, max = 64, message = "login.password.size")
    private String password;
}
