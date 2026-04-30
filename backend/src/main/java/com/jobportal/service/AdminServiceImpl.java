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
import com.jobportal.entity.EmployerSubscription;
import com.jobportal.entity.Profile;
import com.jobportal.entity.User;
import com.jobportal.repository.EmployerSubscriptionRepository;
import com.jobportal.repository.JobRepository;
import com.jobportal.repository.ProfileRepository;
import com.jobportal.repository.UserRepository;
import com.jobportal.security.PiiCryptoService;
import com.jobportal.dto.AdminProfileCompletionDTO;

@Service("adminService")
public class AdminServiceImpl implements AdminService {

    private final UserRepository userRepository;
    private final ProfileRepository profileRepository;
    private final JobRepository jobRepository;
    private final EmployerSubscriptionRepository employerSubscriptionRepository;
    private final CurrentUserService currentUserService;
    private final PiiCryptoService piiCryptoService;

    public AdminServiceImpl(
            UserRepository userRepository,
            ProfileRepository profileRepository,
            JobRepository jobRepository,
            EmployerSubscriptionRepository employerSubscriptionRepository,
            CurrentUserService currentUserService,
            PiiCryptoService piiCryptoService) {
        this.userRepository = userRepository;
        this.profileRepository = profileRepository;
        this.jobRepository = jobRepository;
        this.employerSubscriptionRepository = employerSubscriptionRepository;
        this.currentUserService = currentUserService;
        this.piiCryptoService = piiCryptoService;
    }

    @Override
    public List<AdminProfileCompletionDTO> getProfileCompletionList() {
        CurrentUserService.CurrentUser currentUser = currentUserService.getCurrentUser();
        if (currentUser.accountType() != AccountType.ADMIN) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Admin access required");
        }
        List<User> users = userRepository.findAll();
        @SuppressWarnings("unchecked")
        List<Long> profileIds = (List<Long>) (List<?>) users.stream().map(User::getProfileId).filter(id -> id != null).distinct().toList();
        Map<Long, Profile> profilesById = profileRepository.findAllById(profileIds)
            .stream().collect(Collectors.toMap(Profile::getId, p -> p));
        return users.stream().map(user -> {
            Profile profile = user.getProfileId() != null ? profilesById.get(user.getProfileId()) : null;
            int percent = computeProfileCompletionPercent(profile);
            LocalDateTime lastActive = profile != null ? profile.getUpdatedAt() : user.getUpdatedAt();
            return new AdminProfileCompletionDTO(
                user.getId(),
                user.getName(),
                user.getEmail(),
                user.getAccountType() != null ? user.getAccountType().name() : null,
                percent,
                lastActive
            );
        }).toList();
    }

    private int computeProfileCompletionPercent(Profile profile) {
        if (profile == null) return 0;
        int fields = 0, filled = 0;
        // Key fields for completion (customize as needed)
        if (++fields > 0 && profile.getName() != null && !profile.getName().isBlank()) filled++;
        if (++fields > 0 && profile.getEmail() != null && !profile.getEmail().isBlank()) filled++;
        if (++fields > 0 && profile.getJobTitle() != null && !profile.getJobTitle().isBlank()) filled++;
        if (++fields > 0 && profile.getLocation() != null && !profile.getLocation().isBlank()) filled++;
        if (++fields > 0 && profile.getSkills() != null && !profile.getSkills().isEmpty()) filled++;
        if (++fields > 0 && profile.getExperiences() != null && !profile.getExperiences().isEmpty()) filled++;
        if (++fields > 0 && profile.getEducation() != null && !profile.getEducation().isEmpty()) filled++;
        if (++fields > 0 && profile.getAbout() != null && !profile.getAbout().isBlank()) filled++;
        if (++fields > 0 && profile.getProfileSummary() != null && !profile.getProfileSummary().isBlank()) filled++;
        if (++fields > 0 && profile.getPicture() != null && profile.getPicture().length > 0) filled++;
        return (int) Math.round((filled * 100.0) / fields);
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
        List<Long> employerIds = employerUsers.stream()
            .map(User::getId)
            .filter(id -> id != null && id > 0)
            .toList();
        List<Long> employerProfileIds = employerUsers.stream()
                .map(User::getProfileId)
                .filter(profileId -> profileId != null && profileId > 0)
                .distinct()
                .toList();

        Map<Long, EmployerSubscription> subscriptionsByEmployerId = employerIds.isEmpty()
            ? Collections.emptyMap()
            : employerSubscriptionRepository.findByEmployerIdIn(employerIds).stream()
                .collect(Collectors.toMap(EmployerSubscription::getEmployerId, Function.identity()));

        Map<Long, Profile> profilesById = employerProfileIds.isEmpty()
            ? Collections.emptyMap()
            : profileRepository.findAllById(employerProfileIds).stream()
                .collect(Collectors.toMap(Profile::getId, Function.identity()));

        List<AdminEmployerSummaryDTO> employers = employerUsers.stream()
                .sorted(Comparator.comparing(User::getId, Comparator.nullsLast(Long::compareTo)).reversed())
            .map(user -> toEmployerSummary(user, profilesById.get(user.getProfileId()), subscriptionsByEmployerId.get(user.getId())))
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

    private AdminEmployerSummaryDTO toEmployerSummary(User user, Profile profile, EmployerSubscription subscription) {
        String companyName = fallback(
            profile != null ? profile.getCompany() : null,
            decryptIfNeeded(profile != null ? profile.getName() : null),
            user.getName(),
            "Employer");
        String contactName = fallback(
            profile != null ? profile.getContactPerson() : null,
            decryptIfNeeded(profile != null ? profile.getName() : null),
            user.getName(),
            "N/A");
        String location = joinLocation(
            decryptIfNeeded(profile != null ? profile.getLocation() : null),
            profile != null ? profile.getCity() : null,
            profile != null ? profile.getCountry() : null);

        String subscriptionPlan = "Not Configured";
        if (subscription != null && sanitize(subscription.getPlanName()).length() > 0) {
            subscriptionPlan = sanitize(subscription.getPlanName());
        }

        String subscriptionStatus = "Pending";
        if (subscription != null && subscription.getSubscriptionStatus() != null) {
            subscriptionStatus = sanitize(subscription.getSubscriptionStatus().name());
        }

        int viewsUsed = subscription != null && subscription.getMonthlyResumeViewsUsed() != null
                ? subscription.getMonthlyResumeViewsUsed()
                : 0;
        int viewsLimit = subscription != null && subscription.getMaxResumeViewsPerMonth() != null
                ? subscription.getMaxResumeViewsPerMonth()
                : 0;
        int downloadsUsed = subscription != null && subscription.getMonthlyResumeDownloadsUsed() != null
                ? subscription.getMonthlyResumeDownloadsUsed()
                : 0;
        int downloadsLimit = subscription != null && subscription.getMaxResumeDownloadsPerMonth() != null
                ? subscription.getMaxResumeDownloadsPerMonth()
                : 0;
        LocalDateTime usageWindowStartAt = subscription != null ? subscription.getUsageWindowStartAt() : null;

        return new AdminEmployerSummaryDTO(
                user.getId(),
                companyName,
                contactName,
                user.getEmail(),
                location,
                subscriptionPlan,
                subscriptionStatus,
                viewsUsed,
                viewsLimit,
                downloadsUsed,
                downloadsLimit,
                usageWindowStartAt);
    }

    private String fallback(String... values) {
        if (values == null || values.length == 0) {
            return "";
        }

        for (String value : values) {
            String normalizedValue = sanitize(value);
            if (!normalizedValue.isBlank()) {
                return normalizedValue;
            }
        }

        return "";
    }

    private String joinLocation(String... parts) {
        String combined = java.util.Arrays.stream(parts)
                .map(this::sanitize)
                .filter(part -> !part.isBlank())
                .distinct()
                .collect(Collectors.joining(", "));
        if (!combined.isBlank()) {
            return combined;
        }

        return "N/A";
    }

    private String decryptIfNeeded(String value) {
        String normalizedValue = sanitize(value);
        if (normalizedValue.isBlank()) {
            return "";
        }

        try {
            return sanitize(piiCryptoService.decryptString(normalizedValue));
        } catch (Exception ignored) {
            return normalizedValue;
        }
    }

    private String sanitize(String value) {
        return value == null ? "" : value.trim();
    }
}
