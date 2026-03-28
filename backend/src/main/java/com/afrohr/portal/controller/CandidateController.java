package com.afrohr.portal.controller;

import com.afrohr.portal.model.CandidateProfile;
import com.afrohr.portal.model.User;
import com.afrohr.portal.repository.CandidateProfileRepository;
import com.afrohr.portal.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.*;

@RestController
@RequestMapping("/api/candidates")
@RequiredArgsConstructor
public class CandidateController {

    private final CandidateProfileRepository candidateProfileRepository;
    private final UserRepository userRepository;

    /** Get own profile */
    @GetMapping("/me")
    @PreAuthorize("hasRole('CANDIDATE')")
    public ResponseEntity<CandidateProfile> getMyProfile(
            @AuthenticationPrincipal UserDetails principal) {

        User user = userRepository.findByEmail(principal.getUsername()).orElseThrow();
        return candidateProfileRepository.findByUserId(user.getId())
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    /** Create or update own profile */
    @PutMapping("/me")
    @PreAuthorize("hasRole('CANDIDATE')")
    public ResponseEntity<CandidateProfile> upsertProfile(
            @RequestBody CandidateProfile body,
            @AuthenticationPrincipal UserDetails principal) {

        User user = userRepository.findByEmail(principal.getUsername()).orElseThrow();
        CandidateProfile profile = candidateProfileRepository
                .findByUserId(user.getId())
                .orElse(CandidateProfile.builder().user(user).build());

        profile.setBio(body.getBio());
        profile.setPhone(body.getPhone());
        profile.setLocation(body.getLocation());
        profile.setLinkedinUrl(body.getLinkedinUrl());
        profile.setPortfolioUrl(body.getPortfolioUrl());
        profile.setSkills(body.getSkills());
        profile.setVisibility(body.getVisibility());

        return ResponseEntity.ok(candidateProfileRepository.save(profile));
    }

    /** Upload resume (stores locally; swap for S3 in production) */
    @PostMapping("/me/resume")
    @PreAuthorize("hasRole('CANDIDATE')")
    public ResponseEntity<CandidateProfile> uploadResume(
            @RequestParam("file") MultipartFile file,
            @AuthenticationPrincipal UserDetails principal) throws IOException {

        User user = userRepository.findByEmail(principal.getUsername()).orElseThrow();
        CandidateProfile profile = candidateProfileRepository
                .findByUserId(user.getId())
                .orElse(CandidateProfile.builder().user(user).build());

        Path uploadDir = Paths.get("uploads/resumes");
        Files.createDirectories(uploadDir);

        String filename = user.getId() + "_" + file.getOriginalFilename();
        Path destination = uploadDir.resolve(filename);
        Files.copy(file.getInputStream(), destination, StandardCopyOption.REPLACE_EXISTING);

        profile.setResumePath(destination.toString());
        profile.setResumeOriginalFilename(file.getOriginalFilename());

        return ResponseEntity.ok(candidateProfileRepository.save(profile));
    }

    /** Public: get a candidate's profile by id (if PUBLIC) */
    @GetMapping("/{id}")
    public ResponseEntity<CandidateProfile> getProfile(@PathVariable Long id) {
        return candidateProfileRepository.findById(id)
                .filter(p -> p.getVisibility() == CandidateProfile.ProfileVisibility.PUBLIC)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
}
