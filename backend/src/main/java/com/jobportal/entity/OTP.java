package com.jobportal.entity;

import java.time.LocalDateTime;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "otps")
public class OTP {
    @Id
    private String email;
    private String otpCode;
    private LocalDateTime creationTime;
}
