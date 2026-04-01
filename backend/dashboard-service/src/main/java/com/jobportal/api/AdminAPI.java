package com.jobportal.api;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.jobportal.dto.AdminOverviewDTO;
import com.jobportal.dto.EmployerSubscriptionDTO;
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
}
