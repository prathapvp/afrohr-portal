package com.jobportal.service;

import java.time.LocalDateTime;
import java.util.Collections;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import com.jobportal.dto.AccountType;
import com.jobportal.dto.AdminEmployerSummaryDTO;
import com.jobportal.dto.AdminOverviewDTO;
import com.jobportal.dto.JobStatus;
import com.jobportal.entity.Profile;
import com.jobportal.entity.User;
import com.jobportal.repository.JobRepository;
import com.jobportal.repository.ProfileRepository;
import com.jobportal.repository.UserRepository;

@Service("adminService")
public class AdminServiceImpl implements AdminService {

    private final UserRepository userRepository;
    private final ProfileRepository profileRepository;
    private final JobRepository jobRepository;
    private final CurrentUserService currentUserService;

    public AdminServiceImpl(
            UserRepository userRepository,
            ProfileRepository profileRepository,
            JobRepository jobRepository,
            CurrentUserService currentUserService) {
        this.userRepository = userRepository;
        this.profileRepository = profileRepository;
        this.jobRepository = jobRepository;
        this.currentUserService = currentUserService;
    }

    @Override
    public AdminOverviewDTO getOverview() {
        CurrentUserService.CurrentUser currentUser = currentUserService.getCurrentUser();

        if (currentUser.accountType() != AccountType.ADMIN) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Admin access required");
        }

        long activeEmployers = userRepository.countByAccountType(AccountType.EMPLOYER);
        long activeCandidates = userRepository.countByAccountType(AccountType.APPLICANT);
        long activeStudents = profileRepository.countStudentProfiles();

        long totalUsers = userRepository.count();
        long totalProfiles = profileRepository.count();
        long totalJobs = jobRepository.count();
        long activeJobs = jobRepository.countByJobStatus(JobStatus.ACTIVE);

        List<User> employerUsers = userRepository.findByAccountType(AccountType.EMPLOYER);
        List<Long> employerProfileIds = employerUsers.stream()
                .map(User::getProfileId)
                .filter(profileId -> profileId != null && profileId > 0)
                .distinct()
                .toList();

        Map<Long, Profile> profilesById = employerProfileIds.isEmpty()
            ? Collections.emptyMap()
            : profileRepository.findAllById(employerProfileIds).stream()
                .collect(Collectors.toMap(Profile::getId, Function.identity()));

        List<AdminEmployerSummaryDTO> employers = employerUsers.stream()
                .sorted(Comparator.comparing(User::getId, Comparator.nullsLast(Long::compareTo)).reversed())
                .map(user -> toEmployerSummary(user, profilesById.get(user.getProfileId())))
                .toList();

        long employerSubscriptionsConfigured = employers.stream()
                .filter(employer -> !"Not Configured".equalsIgnoreCase(employer.getSubscriptionPlan()))
                .count();

        long employerSubscriptionsPending = Math.max(0, employers.size() - employerSubscriptionsConfigured);

        return new AdminOverviewDTO(
                activeEmployers,
                activeCandidates,
                activeStudents,
                totalUsers,
                totalProfiles,
                totalJobs,
                activeJobs,
                employerSubscriptionsConfigured,
                employerSubscriptionsPending,
                LocalDateTime.now(),
                employers);
    }

    private AdminEmployerSummaryDTO toEmployerSummary(User user, Profile profile) {
        String companyName = fallback(profile != null ? profile.getCompany() : null, user.getName(), "Employer");
        String contactName = fallback(user.getName(), profile != null ? profile.getContactPerson() : null, "N/A");
        String location = fallback(profile != null ? profile.getLocation() : null, profile != null ? profile.getCity() : null, "N/A");

        String subscriptionPlan = "Not Configured";
        if (profile != null) {
            String classifiedPlan = sanitize(profile.getProfileClassifieds());
            if (!classifiedPlan.isBlank()) {
                subscriptionPlan = classifiedPlan;
            }
        }

        String subscriptionStatus = "Pending";
        if (!"Not Configured".equalsIgnoreCase(subscriptionPlan)) {
            subscriptionStatus = "Active";
        }

        return new AdminEmployerSummaryDTO(
                user.getId(),
                companyName,
                contactName,
                user.getEmail(),
                location,
                subscriptionPlan,
                subscriptionStatus);
    }

    private String fallback(String primary, String secondary, String defaultValue) {
        String normalizedPrimary = sanitize(primary);
        if (!normalizedPrimary.isBlank()) {
            return normalizedPrimary;
        }

        String normalizedSecondary = sanitize(secondary);
        if (!normalizedSecondary.isBlank()) {
            return normalizedSecondary;
        }

        return defaultValue;
    }

    private String sanitize(String value) {
        return value == null ? "" : value.trim();
    }
}
