package com.jobportal.jwt;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class AuthenticationRequest {
	@NotBlank(message = "auth.email.required")
	@Email(message = "auth.email.invalid")
	private String email;

	@NotBlank(message = "auth.password.required")
	@Size(min = 8, max = 64, message = "auth.password.size")
	private String password;
}
