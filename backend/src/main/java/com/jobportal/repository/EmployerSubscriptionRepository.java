package com.jobportal.repository;

import java.util.Optional;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.jobportal.entity.EmployerSubscription;

public interface EmployerSubscriptionRepository extends JpaRepository<EmployerSubscription, Long> {
    Optional<EmployerSubscription> findByEmployerId(Long employerId);
    List<EmployerSubscription> findByEmployerIdIn(List<Long> employerIds);
}
