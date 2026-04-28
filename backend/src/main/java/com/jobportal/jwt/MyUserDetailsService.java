package com.jobportal.jwt;

import java.util.ArrayList;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import com.jobportal.entity.User;
import com.jobportal.repository.UserRepository;

@Service
public class MyUserDetailsService implements UserDetailsService {

	@Autowired
	private UserRepository userRepository;

	@Override
	public UserDetails loadUserByUsername(String email) throws UsernameNotFoundException {
		User user = userRepository.findByEmailIgnoreCase(email)
				.orElseThrow(() -> new UsernameNotFoundException("User not found: " + email));
		return new CustomUserDetails(user.getId(), email, user.getName(), user.getPassword(), user.getProfileId(),
				user.getAccountType(), user.getEmployerRole(), new ArrayList<>());
	}
}
