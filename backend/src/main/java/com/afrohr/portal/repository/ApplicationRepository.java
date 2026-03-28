package com.afrohr.portal.repository;

import com.afrohr.portal.model.Application;
import com.afrohr.portal.model.Application.ApplicationStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ApplicationRepository extends JpaRepository<Application, Long> {
    Page<Application> findByCandidateId(Long candidateId, Pageable pageable);
    Page<Application> findByJobPostingId(Long jobPostingId, Pageable pageable);
    Page<Application> findByJobPostingIdAndStatus(
            Long jobPostingId, ApplicationStatus status, Pageable pageable);
    boolean existsByJobPostingIdAndCandidateId(Long jobPostingId, Long candidateId);
}
