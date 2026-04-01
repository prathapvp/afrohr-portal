package com.jobportal.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.jobportal.dto.AccountType;
import com.jobportal.entity.User;

public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByEmail(String email);

    long countByAccountType(AccountType accountType);

    java.util.List<User> findByAccountType(AccountType accountType);
}
