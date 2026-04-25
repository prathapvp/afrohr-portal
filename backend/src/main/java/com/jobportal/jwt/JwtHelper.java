package com.jobportal.jwt;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;

import java.nio.charset.StandardCharsets;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;
import java.util.function.Function;

import javax.crypto.SecretKey;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Component;

@Component
public class JwtHelper {
	@Value("${jwt.secret}")
	private String SECRET;

	@Value("${jwt.expiration:36000000}")
	private long JWT_TOKEN_VALIDITY;

	private SecretKey signingKey() {
		byte[] keyBytes = SECRET.getBytes(StandardCharsets.UTF_8);
		return Keys.hmacShaKeyFor(keyBytes);
	}

	public String getUsernameFromToken(String token) {
		return getClaimFromToken(token, Claims::getSubject);
	}

	public Date getExpirationDateFromToken(String token) {
		return getClaimFromToken(token, Claims::getExpiration);
	}

	public <T> T getClaimFromToken(String token, Function<Claims, T> claimsResolver) {
		final Claims claims = getAllClaimsFromToken(token);
		return claimsResolver.apply(claims);
	}

	private Claims getAllClaimsFromToken(String token) {
		return Jwts.parser().verifyWith(signingKey()).build().parseSignedClaims(token).getPayload();
	}

	private Boolean isTokenExpired(String token) {
		final Date expiration = getExpirationDateFromToken(token);
		return expiration.before(new Date());
	}

	public String generateToken(UserDetails userDetails) {
		Map<String, Object> claims = new HashMap<>();
		CustomUserDetails customUser = (CustomUserDetails) userDetails;
		claims.put("id", customUser.getId());
		claims.put("name", customUser.getName());
		claims.put("accountType", customUser.getAccountType());
		claims.put("employerRole", customUser.getEmployerRole());
		claims.put("profileId", customUser.getProfileId());
		return doGenerateToken(claims, userDetails.getUsername());
	}

	private String doGenerateToken(Map<String, Object> claims, String subject) {
		return Jwts.builder()
				.claims(claims)
				.subject(subject)
				.issuedAt(new Date(System.currentTimeMillis()))
				.expiration(new Date(System.currentTimeMillis() + JWT_TOKEN_VALIDITY))
				.signWith(signingKey())
				.compact();
	}

	public Boolean validateToken(String token, String username) {
		final String tokenUsername = getUsernameFromToken(token);
		return (tokenUsername.equals(username) && !isTokenExpired(token));
	}
}
