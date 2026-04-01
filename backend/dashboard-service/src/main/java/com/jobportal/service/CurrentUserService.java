package com.jobportal.service;

import com.jobportal.dto.AccountType;

public interface CurrentUserService {
	CurrentUser getCurrentUser();

	record CurrentUser(Long id, String email, String name, AccountType accountType, Long profileId) {
		public boolean isAdmin() {
			return accountType == AccountType.ADMIN;
		}
	}
}