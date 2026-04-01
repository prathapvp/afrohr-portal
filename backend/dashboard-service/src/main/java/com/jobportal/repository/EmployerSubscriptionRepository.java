package com.jobportal.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.jobportal.entity.EmployerSubscription;

public interface EmployerSubscriptionRepository extends JpaRepository<EmployerSubscription, Long> {
    Optional<EmployerSubscription> findByEmployerId(Long employerId);
}
