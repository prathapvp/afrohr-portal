package com.jobportal.api;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.jobportal.exception.JobPortalException;
import com.jobportal.jwt.AuthenticationRequest;
import com.jobportal.jwt.AuthenticationResponse;
import com.jobportal.jwt.JwtHelper;

import jakarta.validation.Valid;

@RestController
@CrossOrigin
@RequestMapping("/api/ahrm/v3/auth")
public class AuthAPI {
	@Autowired
	private UserDetailsService userDetailsService;
	@Autowired
	private AuthenticationManager authenticationManager;

	@Autowired
	private JwtHelper jwtHelper;

	@PostMapping("/login")
	public ResponseEntity<?> createAuthenticationToken(
			@RequestBody @Valid AuthenticationRequest request) throws JobPortalException {
		final UserDetails userDetails;
		try {
			userDetails = userDetailsService.loadUserByUsername(request.getEmail());
		} catch (UsernameNotFoundException e) {
			throw new JobPortalException("User does not exist. Please sign up first.");
		}

		try {
			authenticationManager.authenticate(
					new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword()));
		} catch (BadCredentialsException e) {
			throw new JobPortalException("Incorrect password. Please try again.");
		} catch (AuthenticationException e) {
			throw new JobPortalException("Unable to login. Please verify your account and try again.");
		}
		final String jwt = jwtHelper.generateToken(userDetails);

		return ResponseEntity.ok(new AuthenticationResponse(jwt));
	}
}
