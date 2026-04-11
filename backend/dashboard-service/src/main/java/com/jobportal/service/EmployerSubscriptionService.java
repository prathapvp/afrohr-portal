package com.jobportal.service;

import java.util.List;

import com.jobportal.dto.CreateSubscriptionRequestDTO;
import com.jobportal.dto.EmployerSubscriptionDTO;
import com.jobportal.dto.ResolveSubscriptionRequestDTO;
import com.jobportal.dto.SubscriptionRequestDTO;
import com.jobportal.dto.UpsertEmployerSubscriptionRequest;
import com.jobportal.exception.JobPortalException;

public interface EmployerSubscriptionService {
    EmployerSubscriptionDTO upsertEmployerSubscription(Long employerId, UpsertEmployerSubscriptionRequest request) throws JobPortalException;

    EmployerSubscriptionDTO getEmployerSubscription(Long employerId) throws JobPortalException;

    void deleteEmployerSubscription(Long employerId) throws JobPortalException;

    EmployerSubscriptionDTO getCurrentEmployerSubscription() throws JobPortalException;

    void ensureEmployerCanPost(Long employerId, boolean consumesActiveSlot) throws JobPortalException;

    EmployerSubscriptionDTO consumeResumeAccess(Long employerId, String action) throws JobPortalException;

    EmployerSubscriptionDTO resetMonthlyResumeUsage(Long employerId) throws JobPortalException;

    SubscriptionRequestDTO submitSubscriptionRequest(CreateSubscriptionRequestDTO dto, byte[] statementBytes, String statementName, String statementType) throws JobPortalException;

    SubscriptionRequestDTO updateMySubscriptionRequest(Long requestId, CreateSubscriptionRequestDTO dto, byte[] statementBytes, String statementName, String statementType) throws JobPortalException;

    void deleteMySubscriptionRequest(Long requestId) throws JobPortalException;

    com.jobportal.entity.SubscriptionRequest getPaymentStatementForDownload(Long requestId) throws JobPortalException;

    List<SubscriptionRequestDTO> getMySubscriptionRequests() throws JobPortalException;

    List<SubscriptionRequestDTO> getAllSubscriptionRequests() throws JobPortalException;

    SubscriptionRequestDTO resolveSubscriptionRequest(Long requestId, ResolveSubscriptionRequestDTO dto) throws JobPortalException;
}
