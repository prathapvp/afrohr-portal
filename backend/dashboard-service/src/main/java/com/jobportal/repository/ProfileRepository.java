package com.jobportal.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.jobportal.entity.Profile;

public interface ProfileRepository extends JpaRepository<Profile, Long> {
}
