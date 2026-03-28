package com.jobportal.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.jobportal.entity.Job;

public interface JobRepository extends JpaRepository<Job, Long> {

    List<Job> findByPostedBy(Long postedBy);

    @Query(value = "SELECT * FROM jobs j WHERE EXISTS ("
            + "SELECT 1 FROM jsonb_array_elements(j.applicants) AS elem "
            + "WHERE CAST(elem->>'applicantId' AS bigint) = :applicantId "
            + "AND elem->>'applicationStatus' = :status"
            + ")", nativeQuery = true)
    List<Job> findByApplicantIdAndApplicationStatus(
            @Param("applicantId") Long applicantId,
            @Param("status") String status);
}
