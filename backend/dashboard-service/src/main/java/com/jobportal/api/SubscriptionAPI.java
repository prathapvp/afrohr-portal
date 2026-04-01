package com.jobportal.api;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.jobportal.dto.CreateSubscriptionRequestDTO;
import com.jobportal.dto.EmployerSubscriptionDTO;
import com.jobportal.dto.SubscriptionRequestDTO;
import com.jobportal.exception.JobPortalException;
import com.jobportal.service.EmployerSubscriptionService;

import jakarta.validation.Valid;

@RestController
@CrossOrigin
@RequestMapping("/api/ahrm/v3/subscriptions")
public class SubscriptionAPI {

    private final EmployerSubscriptionService employerSubscriptionService;

    public SubscriptionAPI(EmployerSubscriptionService employerSubscriptionService) {
        this.employerSubscriptionService = employerSubscriptionService;
    }

    @GetMapping("/me")
    public ResponseEntity<EmployerSubscriptionDTO> getMySubscription() throws JobPortalException {
        return ResponseEntity.ok(employerSubscriptionService.getCurrentEmployerSubscription());
    }

    @PostMapping("/request")
    public ResponseEntity<SubscriptionRequestDTO> submitRequest(
            @RequestBody @Valid CreateSubscriptionRequestDTO dto) throws JobPortalException {
        return ResponseEntity.ok(employerSubscriptionService.submitSubscriptionRequest(dto));
    }

    @GetMapping("/requests/me")
    public ResponseEntity<List<SubscriptionRequestDTO>> getMyRequests() throws JobPortalException {
        return ResponseEntity.ok(employerSubscriptionService.getMySubscriptionRequests());
    }
}

