package com.afrohr.portal.repository;

import com.afrohr.portal.model.JobPosting;
import com.afrohr.portal.model.JobPosting.JobStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface JobPostingRepository extends JpaRepository<JobPosting, Long> {
    Page<JobPosting> findByStatus(JobStatus status, Pageable pageable);
    Page<JobPosting> findByEmployerId(Long employerId, Pageable pageable);
    Page<JobPosting> findByTitleContainingIgnoreCaseAndStatus(
            String keyword, JobStatus status, Pageable pageable);
}
