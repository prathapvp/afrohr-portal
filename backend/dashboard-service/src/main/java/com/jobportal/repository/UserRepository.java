package com.jobportal.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.jobportal.dto.AccountType;
import com.jobportal.dto.EmployerRole;
import com.jobportal.entity.User;

public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByEmail(String email);

    Optional<User> findByEmailIgnoreCase(String email);

    long countByAccountType(AccountType accountType);

    java.util.List<User> findByAccountType(AccountType accountType);

    java.util.List<User> findByProfileId(Long profileId);

    java.util.List<User> findByProfileIdAndAccountType(Long profileId, AccountType accountType);

    long countByProfileIdAndAccountTypeAndEmployerRole(Long profileId, AccountType accountType, EmployerRole employerRole);
}
