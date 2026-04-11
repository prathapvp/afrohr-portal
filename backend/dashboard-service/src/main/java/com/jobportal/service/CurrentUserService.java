package com.jobportal.service;

import com.jobportal.dto.AccountType;
import com.jobportal.dto.EmployerRole;

public interface CurrentUserService {
	CurrentUser getCurrentUser();

	record CurrentUser(Long id, String email, String name, AccountType accountType, EmployerRole employerRole, Long profileId) {
		public boolean isAdmin() {
			return accountType == AccountType.ADMIN;
		}
	}
}