package com.jobportal.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.repository.query.Param;
import org.springframework.transaction.annotation.Transactional;

import com.jobportal.entity.Profile;

public interface ProfileRepository extends JpaRepository<Profile, Long> {
	@Query(value = "SELECT COUNT(*) FROM profiles p WHERE UPPER(COALESCE(p.role, '')) = 'STUDENT' OR UPPER(COALESCE(p.user_group, '')) = 'STUDENT'", nativeQuery = true)
	long countStudentProfiles();

	@Modifying
	@Transactional
	@Query("UPDATE Profile p SET p.resumeViewCount = COALESCE(p.resumeViewCount, 0) + 1 WHERE p.id = :id")
	void incrementResumeViewCount(@Param("id") Long id);
}
