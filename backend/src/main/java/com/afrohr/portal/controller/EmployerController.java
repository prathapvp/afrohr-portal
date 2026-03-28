package com.afrohr.portal.controller;

import com.afrohr.portal.model.EmployerProfile;
import com.afrohr.portal.model.User;
import com.afrohr.portal.repository.EmployerProfileRepository;
import com.afrohr.portal.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/employers")
@RequiredArgsConstructor
public class EmployerController {

    private final EmployerProfileRepository employerProfileRepository;
    private final UserRepository userRepository;

    /** Employer: get own dashboard profile */
    @GetMapping("/me")
    @PreAuthorize("hasRole('EMPLOYER')")
    public ResponseEntity<EmployerProfile> getMyProfile(
            @AuthenticationPrincipal UserDetails principal) {

        User user = userRepository.findByEmail(principal.getUsername()).orElseThrow();
        return employerProfileRepository.findByUserId(user.getId())
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    /** Employer: create or update company profile */
    @PutMapping("/me")
    @PreAuthorize("hasRole('EMPLOYER')")
    public ResponseEntity<EmployerProfile> upsertProfile(
            @RequestBody EmployerProfile body,
            @AuthenticationPrincipal UserDetails principal) {

        User user = userRepository.findByEmail(principal.getUsername()).orElseThrow();
        EmployerProfile profile = employerProfileRepository
                .findByUserId(user.getId())
                .orElse(EmployerProfile.builder().user(user).build());

        profile.setCompanyName(body.getCompanyName());
        profile.setCompanyDescription(body.getCompanyDescription());
        profile.setIndustry(body.getIndustry());
        profile.setWebsite(body.getWebsite());
        profile.setLocation(body.getLocation());

        return ResponseEntity.ok(employerProfileRepository.save(profile));
    }

    /** Public: get employer profile by id */
    @GetMapping("/{id}")
    public ResponseEntity<EmployerProfile> getProfile(@PathVariable Long id) {
        return employerProfileRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
}
