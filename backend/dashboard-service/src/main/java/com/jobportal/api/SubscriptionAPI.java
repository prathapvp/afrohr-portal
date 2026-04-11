package com.jobportal.api;

import java.io.IOException;
import java.util.List;
import java.util.Set;

import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.jobportal.dto.CreateSubscriptionRequestDTO;
import com.jobportal.dto.EmployerSubscriptionDTO;
import com.jobportal.dto.SubscriptionRequestDTO;
import com.jobportal.entity.SubscriptionRequest;
import com.jobportal.exception.JobPortalException;
import com.jobportal.service.EmployerSubscriptionService;

import jakarta.validation.ConstraintViolation;
import jakarta.validation.Validator;
import org.springframework.util.StringUtils;

@RestController
@CrossOrigin
@RequestMapping("/api/ahrm/v3/subscriptions")
public class SubscriptionAPI {

    private final EmployerSubscriptionService employerSubscriptionService;
    private final ObjectMapper objectMapper;
    private final Validator validator;

    public SubscriptionAPI(
            EmployerSubscriptionService employerSubscriptionService,
            ObjectMapper objectMapper,
            Validator validator) {
        this.employerSubscriptionService = employerSubscriptionService;
        this.objectMapper = objectMapper;
        this.validator = validator;
    }

    @GetMapping("/me")
    public ResponseEntity<EmployerSubscriptionDTO> getMySubscription() throws JobPortalException {
        return ResponseEntity.ok(employerSubscriptionService.getCurrentEmployerSubscription());
    }

    @PostMapping(value = "/request", consumes = {MediaType.MULTIPART_FORM_DATA_VALUE, MediaType.APPLICATION_JSON_VALUE})
    public ResponseEntity<SubscriptionRequestDTO> submitRequest(
            @RequestPart(value = "data", required = false) String rawData,
            @RequestParam(value = "requestType", required = false) String requestType,
            @RequestParam(value = "requestedPlan", required = false) String requestedPlan,
            @RequestParam(value = "note", required = false) String note,
            @RequestPart(value = "paymentStatement", required = false) MultipartFile file) throws JobPortalException, IOException {
        CreateSubscriptionRequestDTO dto = parseAndValidateRequest(rawData, requestType, requestedPlan, note);
        byte[] bytes = (file != null && !file.isEmpty()) ? file.getBytes() : null;
        String name = (file != null && !file.isEmpty()) ? file.getOriginalFilename() : null;
        String type = (file != null && !file.isEmpty()) ? file.getContentType() : null;
        return ResponseEntity.ok(employerSubscriptionService.submitSubscriptionRequest(dto, bytes, name, type));
    }

    private CreateSubscriptionRequestDTO parseAndValidateRequest(
            String rawData,
            String requestType,
            String requestedPlan,
            String note) throws JobPortalException {
        CreateSubscriptionRequestDTO dto;

        if (StringUtils.hasText(rawData)) {
            try {
                dto = objectMapper.readValue(rawData, CreateSubscriptionRequestDTO.class);
            } catch (IOException ex) {
                throw new JobPortalException("Validation failed. Please check your inputs.");
            }
        } else {
            dto = new CreateSubscriptionRequestDTO();
            if (StringUtils.hasText(requestType)) {
                try {
                    dto.setRequestType(com.jobportal.dto.SubscriptionRequestType.valueOf(requestType.trim().toUpperCase()));
                } catch (IllegalArgumentException ex) {
                    throw new JobPortalException("Invalid request type.");
                }
            }
            dto.setRequestedPlan(StringUtils.hasText(requestedPlan) ? requestedPlan.trim().toUpperCase() : null);
            dto.setNote(StringUtils.hasText(note) ? note.trim() : null);
        }

        Set<ConstraintViolation<CreateSubscriptionRequestDTO>> violations = validator.validate(dto);
        if (!violations.isEmpty()) {
            String validationMessage = violations.iterator().next().getMessage();
            throw new JobPortalException(validationMessage);
        }

        return dto;
    }

    @GetMapping("/requests/me")
    public ResponseEntity<List<SubscriptionRequestDTO>> getMyRequests() throws JobPortalException {
        return ResponseEntity.ok(employerSubscriptionService.getMySubscriptionRequests());
    }

    @PutMapping(value = "/requests/{id}", consumes = {MediaType.MULTIPART_FORM_DATA_VALUE, MediaType.APPLICATION_JSON_VALUE})
    public ResponseEntity<SubscriptionRequestDTO> updateMyRequest(
            @PathVariable Long id,
            @RequestPart(value = "data", required = false) String rawData,
            @RequestParam(value = "requestType", required = false) String requestType,
            @RequestParam(value = "requestedPlan", required = false) String requestedPlan,
            @RequestParam(value = "note", required = false) String note,
            @RequestPart(value = "paymentStatement", required = false) MultipartFile file) throws JobPortalException, IOException {
        CreateSubscriptionRequestDTO dto = parseAndValidateRequest(rawData, requestType, requestedPlan, note);
        byte[] bytes = (file != null && !file.isEmpty()) ? file.getBytes() : null;
        String name = (file != null && !file.isEmpty()) ? file.getOriginalFilename() : null;
        String type = (file != null && !file.isEmpty()) ? file.getContentType() : null;
        return ResponseEntity.ok(employerSubscriptionService.updateMySubscriptionRequest(id, dto, bytes, name, type));
    }

    @DeleteMapping("/requests/{id}")
    public ResponseEntity<Void> deleteMyRequest(@PathVariable Long id) throws JobPortalException {
        employerSubscriptionService.deleteMySubscriptionRequest(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/requests/{id}/statement")
    public ResponseEntity<byte[]> downloadStatement(@PathVariable Long id) throws JobPortalException {
        SubscriptionRequest req = employerSubscriptionService.getPaymentStatementForDownload(id);
        HttpHeaders headers = new HttpHeaders();
        String contentType = req.getPaymentStatementType();
        if (contentType == null || contentType.isBlank()) {
            headers.setContentType(MediaType.APPLICATION_OCTET_STREAM);
        } else {
            headers.setContentType(MediaType.parseMediaType(contentType));
        }
        String disposition = "attachment; filename=\"" + (req.getPaymentStatementName() != null ? req.getPaymentStatementName() : "statement") + "\"";
        headers.set(HttpHeaders.CONTENT_DISPOSITION, disposition);
        return ResponseEntity.ok().headers(headers).body(req.getPaymentStatement());
    }
}

