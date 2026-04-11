package com.jobportal.service;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.Objects;

import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

import com.jobportal.dto.AccountType;
import com.jobportal.dto.CreateSubscriptionRequestDTO;
import com.jobportal.dto.EmployerSubscriptionDTO;
import com.jobportal.dto.JobStatus;
import com.jobportal.dto.PaymentStatus;
import com.jobportal.dto.ResolveSubscriptionRequestDTO;
import com.jobportal.dto.SubscriptionRequestDTO;
import com.jobportal.dto.SubscriptionRequestStatus;
import com.jobportal.dto.SubscriptionStatus;
import com.jobportal.dto.UpsertEmployerSubscriptionRequest;
import com.jobportal.entity.EmployerSubscription;
import com.jobportal.entity.SubscriptionRequest;
import com.jobportal.entity.User;
import com.jobportal.exception.JobPortalException;
import com.jobportal.repository.EmployerSubscriptionRepository;
import com.jobportal.repository.JobRepository;
import com.jobportal.repository.SubscriptionRequestRepository;
import com.jobportal.repository.UserRepository;

@Service("employerSubscriptionService")
public class EmployerSubscriptionServiceImpl implements EmployerSubscriptionService {

    private final EmployerSubscriptionRepository subscriptionRepository;
    private final UserRepository userRepository;
    private final JobRepository jobRepository;
    private final CurrentUserService currentUserService;
    private final SubscriptionRequestRepository subscriptionRequestRepository;

    public EmployerSubscriptionServiceImpl(
            EmployerSubscriptionRepository subscriptionRepository,
            UserRepository userRepository,
            JobRepository jobRepository,
            CurrentUserService currentUserService,
            SubscriptionRequestRepository subscriptionRequestRepository) {
        this.subscriptionRepository = subscriptionRepository;
        this.userRepository = userRepository;
        this.jobRepository = jobRepository;
        this.currentUserService = currentUserService;
        this.subscriptionRequestRepository = subscriptionRequestRepository;
    }

    @Override
    public EmployerSubscriptionDTO upsertEmployerSubscription(Long employerId, UpsertEmployerSubscriptionRequest request)
            throws JobPortalException {
        CurrentUserService.CurrentUser currentUser = currentUserService.getCurrentUser();
        if (!currentUser.isAdmin()) {
            throw new JobPortalException("Admin access required to configure subscriptions");
        }
        if (employerId == null || employerId <= 0) {
            throw new JobPortalException("Employer id is required");
        }

        User employer = userRepository.findById(employerId)
                .orElseThrow(() -> new JobPortalException("Employer not found"));
        if (employer.getAccountType() != AccountType.EMPLOYER) {
            throw new JobPortalException("Subscription can only be configured for EMPLOYER accounts");
        }

        LocalDateTime startAt = request.getStartAt() != null ? request.getStartAt() : LocalDateTime.now();
        LocalDateTime endAt = resolveEndAt(startAt, request);
        if (endAt.isBefore(startAt) || endAt.isEqual(startAt)) {
            throw new JobPortalException("Subscription end time must be after start time");
        }

        EmployerSubscription subscription = subscriptionRepository.findByEmployerId(employerId)
                .orElseGet(EmployerSubscription::new);
        subscription.setEmployerId(employerId);
        subscription.setPlanName(request.getPlanName().trim());
        subscription.setSubscriptionStatus(resolveStatus(request, endAt));
        subscription.setPaymentStatus(request.getPaymentStatus());
        subscription.setStartAt(startAt);
        subscription.setEndAt(endAt);
        subscription.setMaxActiveJobs(resolveMaxActiveJobs(request));
        subscription.setMaxResumeViewsPerMonth(resolveMaxResumeViewsPerMonth(request));
        subscription.setMaxResumeDownloadsPerMonth(resolveMaxResumeDownloadsPerMonth(request));
        if (subscription.getMonthlyResumeViewsUsed() == null) {
            subscription.setMonthlyResumeViewsUsed(0);
        }
        if (subscription.getMonthlyResumeDownloadsUsed() == null) {
            subscription.setMonthlyResumeDownloadsUsed(0);
        }
        if (subscription.getUsageWindowStartAt() == null) {
            subscription.setUsageWindowStartAt(startOfMonth(LocalDateTime.now()));
        }

        EmployerSubscription saved = subscriptionRepository.save(subscription);
        return toDto(saved);
    }

    @Override
    public EmployerSubscriptionDTO getEmployerSubscription(Long employerId) throws JobPortalException {
        CurrentUserService.CurrentUser currentUser = currentUserService.getCurrentUser();
        if (!currentUser.isAdmin()) {
            throw new JobPortalException("Admin access required");
        }
        EmployerSubscription subscription = subscriptionRepository.findByEmployerId(employerId)
                .orElseThrow(() -> new JobPortalException("No subscription configured for this employer"));
        return toDto(subscription);
    }

    @Override
    public void deleteEmployerSubscription(Long employerId) throws JobPortalException {
        CurrentUserService.CurrentUser currentUser = currentUserService.getCurrentUser();
        if (!currentUser.isAdmin()) {
            throw new JobPortalException("Admin access required");
        }
        EmployerSubscription subscription = subscriptionRepository.findByEmployerId(employerId)
                .orElseThrow(() -> new JobPortalException("No subscription found for this employer"));
        subscriptionRepository.delete(Objects.requireNonNull(subscription));
    }

    @Override
    public EmployerSubscriptionDTO getCurrentEmployerSubscription() throws JobPortalException {
        CurrentUserService.CurrentUser currentUser = currentUserService.getCurrentUser();
        if (currentUser.accountType() != AccountType.EMPLOYER && currentUser.accountType() != AccountType.ADMIN) {
            throw new JobPortalException("Employer access required");
        }

        EmployerSubscription subscription = subscriptionRepository.findByEmployerId(currentUser.id())
                .orElseThrow(() -> new JobPortalException("No subscription configured for this employer"));
        return toDto(subscription);
    }

    @Override
    public void ensureEmployerCanPost(Long employerId, boolean consumesActiveSlot) throws JobPortalException {
        EmployerSubscription subscription = subscriptionRepository.findByEmployerId(employerId)
                .orElseThrow(() -> new JobPortalException("No active subscription found. Please complete payment and activate a plan."));

        LocalDateTime now = LocalDateTime.now();
        if (subscription.getPaymentStatus() != PaymentStatus.PAID) {
            throw new JobPortalException("Payment is not completed for the current subscription plan.");
        }

        if (subscription.getSubscriptionStatus() != SubscriptionStatus.ACTIVE) {
            throw new JobPortalException("Subscription is not active. Please renew or contact support.");
        }

        if (subscription.getEndAt() == null || !subscription.getEndAt().isAfter(now)) {
            subscription.setSubscriptionStatus(SubscriptionStatus.EXPIRED);
            subscriptionRepository.save(subscription);
            throw new JobPortalException("Subscription expired. Please renew to continue posting jobs.");
        }

        if (!consumesActiveSlot) {
            return;
        }

        int activeJobs = (int) jobRepository.countByPostedByAndJobStatus(employerId, JobStatus.ACTIVE);
        Integer maxActiveJobs = subscription.getMaxActiveJobs();
        if (maxActiveJobs != null && maxActiveJobs > 0 && activeJobs >= maxActiveJobs) {
            throw new JobPortalException("Plan limit reached: maximum " + maxActiveJobs + " active jobs allowed.");
        }
    }

    @Override
    public EmployerSubscriptionDTO consumeResumeAccess(Long employerId, String action) throws JobPortalException {
        EmployerSubscription subscription = subscriptionRepository.findByEmployerId(employerId)
                .orElseThrow(() -> new JobPortalException("No active subscription found. Please complete payment and activate a plan."));

        LocalDateTime now = LocalDateTime.now();
        if (subscription.getPaymentStatus() != PaymentStatus.PAID) {
            throw new JobPortalException("Payment is not completed for the current subscription plan.");
        }
        if (subscription.getSubscriptionStatus() != SubscriptionStatus.ACTIVE) {
            throw new JobPortalException("Subscription is not active. Please renew or contact support.");
        }
        if (subscription.getEndAt() == null || !subscription.getEndAt().isAfter(now)) {
            subscription.setSubscriptionStatus(SubscriptionStatus.EXPIRED);
            subscriptionRepository.save(subscription);
            throw new JobPortalException("Subscription expired. Please renew to continue accessing resumes.");
        }

        LocalDateTime usageStart = subscription.getUsageWindowStartAt();
        if (usageStart == null || isNewCalendarMonth(usageStart, now)) {
            subscription.setUsageWindowStartAt(startOfMonth(now));
            subscription.setMonthlyResumeViewsUsed(0);
            subscription.setMonthlyResumeDownloadsUsed(0);
        }

        String normalizedAction = action == null ? "VIEW" : action.trim().toUpperCase();
        if ("DOWNLOAD".equals(normalizedAction)) {
            int used = subscription.getMonthlyResumeDownloadsUsed() == null ? 0 : subscription.getMonthlyResumeDownloadsUsed();
            Integer limit = subscription.getMaxResumeDownloadsPerMonth();
            if (limit != null && limit > 0 && used >= limit) {
                throw new JobPortalException("Monthly download limit reached for your plan. Please upgrade to continue.");
            }
            subscription.setMonthlyResumeDownloadsUsed(used + 1);
        } else {
            int used = subscription.getMonthlyResumeViewsUsed() == null ? 0 : subscription.getMonthlyResumeViewsUsed();
            Integer limit = subscription.getMaxResumeViewsPerMonth();
            if (limit != null && limit > 0 && used >= limit) {
                throw new JobPortalException("Monthly resume view limit reached for your plan. Please upgrade to continue.");
            }
            subscription.setMonthlyResumeViewsUsed(used + 1);
        }

        EmployerSubscription saved = subscriptionRepository.save(subscription);
        return toDto(saved);
    }

    @Override
    public EmployerSubscriptionDTO resetMonthlyResumeUsage(Long employerId) throws JobPortalException {
        CurrentUserService.CurrentUser currentUser = currentUserService.getCurrentUser();
        if (!currentUser.isAdmin()) {
            throw new JobPortalException("Admin access required");
        }
        EmployerSubscription subscription = subscriptionRepository.findByEmployerId(employerId)
                .orElseThrow(() -> new JobPortalException("No subscription configured for this employer"));

        subscription.setMonthlyResumeViewsUsed(0);
        subscription.setMonthlyResumeDownloadsUsed(0);
        subscription.setUsageWindowStartAt(startOfMonth(LocalDateTime.now()));
        return toDto(subscriptionRepository.save(subscription));
    }

    private EmployerSubscriptionDTO toDto(EmployerSubscription subscription) {
        int activeJobs = (int) jobRepository.countByPostedByAndJobStatus(subscription.getEmployerId(), JobStatus.ACTIVE);
        long remainingDays = Math.max(0, Duration.between(LocalDateTime.now(), subscription.getEndAt()).toDays());
        boolean postingAllowed = subscription.getSubscriptionStatus() == SubscriptionStatus.ACTIVE
                && subscription.getPaymentStatus() == PaymentStatus.PAID
                && subscription.getEndAt() != null
                && subscription.getEndAt().isAfter(LocalDateTime.now())
                && (subscription.getMaxActiveJobs() == null || subscription.getMaxActiveJobs() <= 0 || activeJobs < subscription.getMaxActiveJobs());
        return EmployerSubscriptionDTO.fromEntity(subscription, activeJobs, postingAllowed, remainingDays);
    }

    private LocalDateTime resolveEndAt(LocalDateTime startAt, UpsertEmployerSubscriptionRequest request) {
        if (request.getEndAt() != null) {
            return request.getEndAt();
        }
        if (request.getDurationDays() != null && request.getDurationDays() > 0) {
            return startAt.plusDays(request.getDurationDays());
        }
        return startAt.plusDays(30);
    }

    private SubscriptionStatus resolveStatus(UpsertEmployerSubscriptionRequest request, LocalDateTime endAt) {
        if (request.getSubscriptionStatus() != null) {
            return request.getSubscriptionStatus();
        }
        if (endAt.isBefore(LocalDateTime.now())) {
            return SubscriptionStatus.EXPIRED;
        }
        return request.getPaymentStatus() == PaymentStatus.PAID ? SubscriptionStatus.ACTIVE : SubscriptionStatus.PENDING;
    }

    private Integer resolveMaxActiveJobs(UpsertEmployerSubscriptionRequest request) {
        if (request.getMaxActiveJobs() != null && request.getMaxActiveJobs() > 0) {
            return request.getMaxActiveJobs();
        }

        String plan = request.getPlanName() == null ? "" : request.getPlanName().trim().toUpperCase();
        return switch (plan) {
            case "FREE" -> 1;
            case "STARTER" -> 5;
            case "PRO" -> 20;
            case "ENTERPRISE" -> 0;
            default -> 5;
        };
    }

    private Integer resolveMaxResumeViewsPerMonth(UpsertEmployerSubscriptionRequest request) {
        if (request.getMaxResumeViewsPerMonth() != null && request.getMaxResumeViewsPerMonth() > 0) {
            return request.getMaxResumeViewsPerMonth();
        }

        String plan = request.getPlanName() == null ? "" : request.getPlanName().trim().toUpperCase();
        return switch (plan) {
            case "FREE" -> 20;
            case "STARTER" -> 100;
            case "PRO" -> 500;
            case "ENTERPRISE" -> 5000;
            default -> 100;
        };
    }

    private Integer resolveMaxResumeDownloadsPerMonth(UpsertEmployerSubscriptionRequest request) {
        if (request.getMaxResumeDownloadsPerMonth() != null && request.getMaxResumeDownloadsPerMonth() > 0) {
            return request.getMaxResumeDownloadsPerMonth();
        }

        String plan = request.getPlanName() == null ? "" : request.getPlanName().trim().toUpperCase();
        return switch (plan) {
            case "FREE" -> 10;
            case "STARTER" -> 50;
            case "PRO" -> 250;
            case "ENTERPRISE" -> 2500;
            default -> 50;
        };
    }

    private boolean isNewCalendarMonth(LocalDateTime usageStart, LocalDateTime now) {
        return usageStart.getYear() != now.getYear() || usageStart.getMonthValue() != now.getMonthValue();
    }

    private LocalDateTime startOfMonth(LocalDateTime reference) {
        return reference.withDayOfMonth(1).toLocalDate().atStartOfDay();
    }

    private static final long MAX_STATEMENT_BYTES = 5 * 1024 * 1024L; // 5 MB
    private static final java.util.Set<String> ALLOWED_STATEMENT_TYPES = java.util.Set.of(
            "application/pdf", "image/jpeg", "image/jpg", "image/png");

    private void validatePaymentStatement(byte[] statementBytes, String statementType) throws JobPortalException {
        if (statementBytes != null && statementBytes.length > 0) {
            if (statementBytes.length > MAX_STATEMENT_BYTES) {
                throw new JobPortalException("Payment statement must be under 5 MB");
            }
            if (statementType == null || !ALLOWED_STATEMENT_TYPES.contains(statementType.toLowerCase().trim())) {
                throw new JobPortalException("Payment statement must be a PDF, JPEG or PNG file");
            }
        }
    }

    private SubscriptionRequest getOwnedPendingRequest(Long requestId, CurrentUserService.CurrentUser currentUser) throws JobPortalException {
        if (currentUser.accountType() != AccountType.EMPLOYER) {
            throw new JobPortalException("Employer access required");
        }

        Long safeRequestId = Objects.requireNonNull(requestId, "Request ID is required");
        SubscriptionRequest request = subscriptionRequestRepository.findById(safeRequestId)
                .orElseThrow(() -> new JobPortalException("Subscription request not found"));

        if (request.getEmployerId() == null || !request.getEmployerId().equals(currentUser.id())) {
            throw new JobPortalException("Access denied");
        }
        if (request.getStatus() != SubscriptionRequestStatus.PENDING) {
            throw new JobPortalException("Only pending requests can be modified");
        }

        return request;
    }

    @Override
    public SubscriptionRequestDTO submitSubscriptionRequest(CreateSubscriptionRequestDTO dto,
            byte[] statementBytes, String statementName, String statementType) throws JobPortalException {
        CurrentUserService.CurrentUser currentUser = currentUserService.getCurrentUser();
        if (currentUser.accountType() != AccountType.EMPLOYER) {
            throw new JobPortalException("Employer access required to submit a subscription request");
        }

        validatePaymentStatement(statementBytes, statementType);

        SubscriptionRequest request = new SubscriptionRequest();
        request.setEmployerId(currentUser.id());
        request.setRequestType(dto.getRequestType());
        request.setStatus(SubscriptionRequestStatus.PENDING);
        request.setRequestedPlan(dto.getRequestedPlan());
        request.setNote(dto.getNote());

        if (statementBytes != null && statementBytes.length > 0) {
            request.setPaymentStatement(statementBytes);
            request.setPaymentStatementName(statementName);
            request.setPaymentStatementType(statementType);
        }

        return SubscriptionRequestDTO.fromEntity(subscriptionRequestRepository.save(request));
    }

    @Override
    public SubscriptionRequestDTO updateMySubscriptionRequest(Long requestId, CreateSubscriptionRequestDTO dto,
            byte[] statementBytes, String statementName, String statementType) throws JobPortalException {
        CurrentUserService.CurrentUser currentUser = currentUserService.getCurrentUser();
        SubscriptionRequest request = getOwnedPendingRequest(requestId, currentUser);

        validatePaymentStatement(statementBytes, statementType);

        request.setRequestType(dto.getRequestType());
        request.setRequestedPlan(dto.getRequestedPlan());
        request.setNote(dto.getNote());

        if (statementBytes != null && statementBytes.length > 0) {
            request.setPaymentStatement(statementBytes);
            request.setPaymentStatementName(statementName);
            request.setPaymentStatementType(statementType);
        }

        return SubscriptionRequestDTO.fromEntity(subscriptionRequestRepository.save(request));
    }

    @Override
    public void deleteMySubscriptionRequest(Long requestId) throws JobPortalException {
        CurrentUserService.CurrentUser currentUser = currentUserService.getCurrentUser();
        SubscriptionRequest request = getOwnedPendingRequest(requestId, currentUser);
        subscriptionRequestRepository.delete(Objects.requireNonNull(request));
    }

    @Override
    public SubscriptionRequest getPaymentStatementForDownload(Long requestId) throws JobPortalException {
        CurrentUserService.CurrentUser currentUser = currentUserService.getCurrentUser();
        Long safeRequestId = Objects.requireNonNull(requestId, "Request ID is required");
        SubscriptionRequest req = subscriptionRequestRepository.findById(safeRequestId)
                .orElseThrow(() -> new JobPortalException("Request not found"));

        boolean isAdmin = currentUser.isAdmin();
        boolean isOwner = currentUser.accountType() == AccountType.EMPLOYER
                && req.getEmployerId() != null
                && req.getEmployerId().equals(currentUser.id());

        if (!isAdmin && !isOwner) {
            throw new JobPortalException("Access denied");
        }
        if (req.getPaymentStatement() == null || req.getPaymentStatement().length == 0) {
            throw new JobPortalException("No payment statement attached to this request");
        }
        return req;
    }

    @Override
    public List<SubscriptionRequestDTO> getMySubscriptionRequests() throws JobPortalException {
        CurrentUserService.CurrentUser currentUser = currentUserService.getCurrentUser();
        if (currentUser.accountType() != AccountType.EMPLOYER) {
            throw new JobPortalException("Employer access required");
        }
        return subscriptionRequestRepository.findByEmployerIdOrderByCreatedAtDesc(currentUser.id())
                .stream()
                .map(SubscriptionRequestDTO::fromEntity)
                .collect(Collectors.toList());
    }

    @Override
    public List<SubscriptionRequestDTO> getAllSubscriptionRequests() throws JobPortalException {
        CurrentUserService.CurrentUser currentUser = currentUserService.getCurrentUser();
        if (!currentUser.isAdmin()) {
            throw new JobPortalException("Admin access required");
        }
        return subscriptionRequestRepository.findAllByOrderByCreatedAtDesc()
                .stream()
                .map(SubscriptionRequestDTO::fromEntity)
                .collect(Collectors.toList());
    }

    @Override
    public SubscriptionRequestDTO resolveSubscriptionRequest(Long requestId, ResolveSubscriptionRequestDTO dto) throws JobPortalException {
        CurrentUserService.CurrentUser currentUser = currentUserService.getCurrentUser();
        if (!currentUser.isAdmin()) {
            throw new JobPortalException("Admin access required");
        }
        if (dto.getResolution() == SubscriptionRequestStatus.PENDING) {
            throw new JobPortalException("Resolution must be APPROVED or REJECTED");
        }

        Long safeRequestId = Objects.requireNonNull(requestId, "Request ID is required");
        SubscriptionRequest request = subscriptionRequestRepository.findById(safeRequestId)
                .orElseThrow(() -> new JobPortalException("Subscription request not found"));

        if (dto.getResolution() == SubscriptionRequestStatus.APPROVED
                && (request.getPaymentStatement() == null || request.getPaymentStatement().length == 0)) {
            throw new JobPortalException("Cannot approve request without payment statement");
        }

        request.setStatus(dto.getResolution());
        request.setAdminNote(dto.getAdminNote());
        request.setResolvedAt(java.time.LocalDateTime.now());

        return SubscriptionRequestDTO.fromEntity(subscriptionRequestRepository.save(request));
    }
}
