package com.jobportal.jwt;

import java.util.Collection;

import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import com.jobportal.dto.AccountType;
import com.jobportal.dto.EmployerRole;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class CustomUserDetails implements UserDetails {
	private static final long serialVersionUID = 1L;
	private Long id;
	private String username;
	private String name;
	private String password;
	private Long profileId;
	private AccountType accountType;
	private EmployerRole employerRole;
	private Collection<? extends GrantedAuthority> authorities;

	@Override
	public boolean isAccountNonExpired() { return true; }
	@Override
	public boolean isAccountNonLocked() { return true; }
	@Override
	public boolean isCredentialsNonExpired() { return true; }
	@Override
	public boolean isEnabled() { return true; }
}
