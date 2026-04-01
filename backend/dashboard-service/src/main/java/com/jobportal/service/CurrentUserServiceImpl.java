package com.jobportal.service;

import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import com.jobportal.entity.User;
import com.jobportal.jwt.CustomUserDetails;
import com.jobportal.repository.UserRepository;

@Service("currentUserService")
public class CurrentUserServiceImpl implements CurrentUserService {

	private final UserRepository userRepository;

	public CurrentUserServiceImpl(UserRepository userRepository) {
		this.userRepository = userRepository;
	}

	@Override
	public CurrentUser getCurrentUser() {
		Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
		if (authentication == null || authentication.getName() == null || authentication.getName().isBlank()) {
			throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Authentication required");
		}

		Object principal = authentication.getPrincipal();
		if (principal instanceof CustomUserDetails currentUser) {
			return new CurrentUser(
					currentUser.getId(),
					currentUser.getUsername(),
					currentUser.getName(),
					currentUser.getAccountType(),
					currentUser.getProfileId());
		}

		User user = userRepository.findByEmail(authentication.getName())
				.orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "User not found"));

		return new CurrentUser(user.getId(), user.getEmail(), user.getName(), user.getAccountType(), user.getProfileId());
	}
}