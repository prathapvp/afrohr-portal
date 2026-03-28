package com.afrohr.portal.controller;

import com.afrohr.portal.model.JobPosting;
import com.afrohr.portal.model.JobPosting.JobStatus;
import com.afrohr.portal.model.User;
import com.afrohr.portal.repository.JobPostingRepository;
import com.afrohr.portal.repository.UserRepository;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.*;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/jobs")
@RequiredArgsConstructor
public class JobPostingController {

    private final JobPostingRepository jobPostingRepository;
    private final UserRepository userRepository;

    /** Public: list open jobs with optional keyword search and pagination */
    @GetMapping
    public ResponseEntity<Page<JobPosting>> listJobs(
            @RequestParam(required = false) String keyword,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {

        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        Page<JobPosting> jobs = (keyword != null && !keyword.isBlank())
                ? jobPostingRepository.findByTitleContainingIgnoreCaseAndStatus(
                        keyword, JobStatus.OPEN, pageable)
                : jobPostingRepository.findByStatus(JobStatus.OPEN, pageable);

        return ResponseEntity.ok(jobs);
    }

    /** Public: get single job */
    @GetMapping("/{id}")
    public ResponseEntity<JobPosting> getJob(@PathVariable Long id) {
        return jobPostingRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    /** Employer: create job posting */
    @PostMapping
    @PreAuthorize("hasRole('EMPLOYER')")
    public ResponseEntity<JobPosting> createJob(
            @Valid @RequestBody JobPosting jobPosting,
            @AuthenticationPrincipal UserDetails principal) {

        User employer = userRepository.findByEmail(principal.getUsername()).orElseThrow();
        jobPosting.setEmployer(employer);
        return ResponseEntity.ok(jobPostingRepository.save(jobPosting));
    }

    /** Employer: update own job posting */
    @PutMapping("/{id}")
    @PreAuthorize("hasRole('EMPLOYER')")
    public ResponseEntity<JobPosting> updateJob(
            @PathVariable Long id,
            @Valid @RequestBody JobPosting updated,
            @AuthenticationPrincipal UserDetails principal) {

        return jobPostingRepository.findById(id)
                .filter(j -> j.getEmployer().getEmail().equals(principal.getUsername()))
                .map(j -> {
                    j.setTitle(updated.getTitle());
                    j.setDescription(updated.getDescription());
                    j.setLocation(updated.getLocation());
                    j.setEmploymentType(updated.getEmploymentType());
                    j.setExperienceLevel(updated.getExperienceLevel());
                    j.setSalaryRange(updated.getSalaryRange());
                    j.setDeadline(updated.getDeadline());
                    j.setStatus(updated.getStatus());
                    return ResponseEntity.ok(jobPostingRepository.save(j));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    /** Employer: delete own job posting */
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('EMPLOYER')")
    public ResponseEntity<Void> deleteJob(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails principal) {

        return jobPostingRepository.findById(id)
                .filter(j -> j.getEmployer().getEmail().equals(principal.getUsername()))
                .map(j -> {
                    jobPostingRepository.delete(j);
                    return ResponseEntity.<Void>noContent().build();
                })
                .orElse(ResponseEntity.notFound().build());
    }
}
