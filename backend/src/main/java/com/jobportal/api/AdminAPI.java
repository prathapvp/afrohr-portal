package com.jobportal.api;

import java.util.List;

import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.jobportal.entity.SubscriptionRequest;

import com.jobportal.dto.AdminOverviewDTO;
import com.jobportal.dto.EmployerSubscriptionDTO;
import com.jobportal.dto.AdminProfileCompletionDTO;
import com.jobportal.dto.ResolveSubscriptionRequestDTO;
import com.jobportal.dto.SubscriptionRequestDTO;
import com.jobportal.dto.UpsertEmployerSubscriptionRequest;
import com.jobportal.exception.JobPortalException;
import com.jobportal.service.AdminService;
import com.jobportal.service.EmployerSubscriptionService;

import jakarta.validation.Valid;

@RestController
@CrossOrigin
@RequestMapping("/api/ahrm/v3/admin")
public class AdminAPI {

    private final AdminService adminService;
    private final EmployerSubscriptionService employerSubscriptionService;

    public AdminAPI(AdminService adminService, EmployerSubscriptionService employerSubscriptionService) {
        this.adminService = adminService;
        this.employerSubscriptionService = employerSubscriptionService;
    }

    @GetMapping("/profile-completion")
    public ResponseEntity<List<AdminProfileCompletionDTO>> getProfileCompletion() {
        return ResponseEntity.ok(adminService.getProfileCompletionList());
    }

    @GetMapping("/overview")
    public ResponseEntity<AdminOverviewDTO> getAdminOverview() {
        return ResponseEntity.ok(adminService.getOverview());
    }

    @GetMapping("/subscriptions/{employerId}")
    public ResponseEntity<EmployerSubscriptionDTO> getSubscription(
            @PathVariable Long employerId) throws JobPortalException {
        return ResponseEntity.ok(employerSubscriptionService.getEmployerSubscription(employerId));
    }

    @DeleteMapping("/subscriptions/{employerId}")
    public ResponseEntity<Void> deleteSubscription(
            @PathVariable Long employerId) throws JobPortalException {
        employerSubscriptionService.deleteEmployerSubscription(employerId);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/subscriptions/{employerId}")
    public ResponseEntity<EmployerSubscriptionDTO> upsertSubscription(
            @PathVariable Long employerId,
            @RequestBody @Valid UpsertEmployerSubscriptionRequest request) throws JobPortalException {
        return ResponseEntity.ok(employerSubscriptionService.upsertEmployerSubscription(employerId, request));
    }

    @PostMapping("/subscriptions/{employerId}/reset-usage")
    public ResponseEntity<EmployerSubscriptionDTO> resetSubscriptionUsage(
            @PathVariable Long employerId) throws JobPortalException {
        return ResponseEntity.ok(employerSubscriptionService.resetMonthlyResumeUsage(employerId));
    }

    @GetMapping("/subscription-requests")
    public ResponseEntity<List<SubscriptionRequestDTO>> getAllSubscriptionRequests() throws JobPortalException {
        return ResponseEntity.ok(employerSubscriptionService.getAllSubscriptionRequests());
    }

    @PostMapping("/subscription-requests/{requestId}/resolve")
    public ResponseEntity<SubscriptionRequestDTO> resolveSubscriptionRequest(
            @PathVariable Long requestId,
            @RequestBody @Valid ResolveSubscriptionRequestDTO dto) throws JobPortalException {
        return ResponseEntity.ok(employerSubscriptionService.resolveSubscriptionRequest(requestId, dto));
    }

    @GetMapping("/subscription-requests/{requestId}/statement")
    public ResponseEntity<byte[]> downloadStatementAsAdmin(
            @PathVariable Long requestId) throws JobPortalException {
        SubscriptionRequest req = employerSubscriptionService.getPaymentStatementForDownload(requestId);
        HttpHeaders headers = new HttpHeaders();
        String contentType = req.getPaymentStatementType();
        if (contentType == null || contentType.isBlank()) {
            headers.setContentType(MediaType.APPLICATION_OCTET_STREAM);
        } else {
            headers.setContentType(MediaType.parseMediaType(contentType));
        }
        String disposition = "inline; filename=\"" + (req.getPaymentStatementName() != null ? req.getPaymentStatementName() : "statement") + "\"";
        headers.set(HttpHeaders.CONTENT_DISPOSITION, disposition);
        return ResponseEntity.ok().headers(headers).body(req.getPaymentStatement());
    }
}
