package com.afrohr.portal.controller;

import com.afrohr.portal.dto.request.LoginRequest;
import com.afrohr.portal.dto.request.RegisterRequest;
import com.afrohr.portal.dto.response.AuthResponse;
import com.afrohr.portal.model.User;
import com.afrohr.portal.repository.UserRepository;
import com.afrohr.portal.security.JwtTokenProvider;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.*;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthenticationManager authenticationManager;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider jwtTokenProvider;

    @PostMapping("/register")
    public ResponseEntity<AuthResponse> register(@Valid @RequestBody RegisterRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new IllegalArgumentException("Email is already in use");
        }

        User user = User.builder()
                .name(request.getName())
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .role(User.Role.valueOf(request.getRole().toUpperCase()))
                .build();

        userRepository.save(user);

        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                        request.getEmail(), request.getPassword()));

        String token = jwtTokenProvider.generateToken(authentication);
        return ResponseEntity.ok(new AuthResponse(token, user.getEmail(), user.getRole().name()));
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest request) {
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                        request.getEmail(), request.getPassword()));

        String token = jwtTokenProvider.generateToken(authentication);
        User user = userRepository.findByEmail(request.getEmail()).orElseThrow();
        return ResponseEntity.ok(new AuthResponse(token, user.getEmail(), user.getRole().name()));
    }
}
