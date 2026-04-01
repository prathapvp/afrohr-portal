package com.jobportal.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.jobportal.dto.SubscriptionRequestStatus;
import com.jobportal.entity.SubscriptionRequest;

public interface SubscriptionRequestRepository extends JpaRepository<SubscriptionRequest, Long> {
    List<SubscriptionRequest> findByEmployerIdOrderByCreatedAtDesc(Long employerId);
    List<SubscriptionRequest> findByStatusOrderByCreatedAtDesc(SubscriptionRequestStatus status);
    List<SubscriptionRequest> findAllByOrderByCreatedAtDesc();
}
