package com.jobportal.service;

import java.time.Duration;
import java.time.LocalDateTime;

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
        subscriptionRepository.delete(subscription);
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

    @Override
    public SubscriptionRequestDTO submitSubscriptionRequest(CreateSubscriptionRequestDTO dto) throws JobPortalException {
        CurrentUserService.CurrentUser currentUser = currentUserService.getCurrentUser();
        if (currentUser.accountType() != AccountType.EMPLOYER) {
            throw new JobPortalException("Employer access required to submit a subscription request");
        }

        SubscriptionRequest request = new SubscriptionRequest();
        request.setEmployerId(currentUser.id());
        request.setRequestType(dto.getRequestType());
        request.setStatus(SubscriptionRequestStatus.PENDING);
        request.setNote(dto.getNote());

        return SubscriptionRequestDTO.fromEntity(subscriptionRequestRepository.save(request));
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

        SubscriptionRequest request = subscriptionRequestRepository.findById(requestId)
                .orElseThrow(() -> new JobPortalException("Subscription request not found"));

        if (request.getStatus() != SubscriptionRequestStatus.PENDING) {
            throw new JobPortalException("Request has already been resolved");
        }

        request.setStatus(dto.getResolution());
        request.setAdminNote(dto.getAdminNote());
        request.setResolvedAt(java.time.LocalDateTime.now());

        return SubscriptionRequestDTO.fromEntity(subscriptionRequestRepository.save(request));
    }
}
