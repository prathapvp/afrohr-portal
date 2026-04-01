package com.jobportal.security;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import com.jobportal.jwt.JwtAuthenticationEntryPoint;
import com.jobportal.jwt.JwtAuthenticationFilter;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    @Autowired
    private JwtAuthenticationEntryPoint point;
    @Autowired
    private JwtAuthenticationFilter filter;

    @Autowired
    private SecurityHeadersFilter securityHeadersFilter;

    @Autowired
    private RateLimitFilter rateLimitFilter;

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
            .csrf(csrf -> csrf.disable())
            .cors(cors -> cors.configurationSource(corsConfigurationSource()))
            .authorizeHttpRequests(auth -> auth
                    .requestMatchers(
                            "/api/ahrm/v3/auth/login",
                            "/auth/login",
                            "/api/ahrm/v3/users/register",
                            "/api/ahrm/v3/users/verifyOtp/**",
                            "/api/ahrm/v3/users/sendOtp/**",
                            "/api/ahrm/v3/users/changePass",
                            "/api/dashboard",
                            "/api/dashboard/**",
                            "/api/audiences",
                            "/api/search",
                            "/api/ahrm/v3/swagger-ui/**",
                            "/api/ahrm/v3/v3/api-docs/**",
                            "/api/ahrm/v3/api-docs/**",
                            "/swagger-ui/**",
                            "/v3/api-docs/**",
                            "/actuator/**"
                            ).permitAll()
                            .requestMatchers(HttpMethod.GET,
                                "/api/ahrm/v3/jobs/getAll",
                                "/api/ahrm/v3/jobs/get/*",
                                "/api/ahrm/v3/jobs/image/*",
                                "/api/ahrm/v3/departments",
                                "/api/ahrm/v3/departments/*",
                                "/api/ahrm/v3/industries",
                                "/api/ahrm/v3/industries/*",
                                "/api/ahrm/v3/employment-types",
                                "/api/ahrm/v3/employment-types/*",
                                "/api/ahrm/v3/work-modes",
                                "/api/ahrm/v3/work-modes/*"
                    ).permitAll()
                    .anyRequest().authenticated()
            )
            .exceptionHandling(ex -> ex.authenticationEntryPoint(point))
            .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS));

        http.addFilterBefore(rateLimitFilter, UsernamePasswordAuthenticationFilter.class);
        http.addFilterBefore(securityHeadersFilter, UsernamePasswordAuthenticationFilter.class);
        http.addFilterBefore(filter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        configuration.addAllowedOrigin("http://localhost:5173");
        configuration.addAllowedOrigin("http://localhost:5174");
        configuration.addAllowedOrigin("http://127.0.0.1:5173");
        configuration.addAllowedOrigin("http://127.0.0.1:5174");
        configuration.addAllowedOrigin("http://localhost:3000");
        configuration.addAllowedOrigin("http://localhost:3001");
        configuration.addAllowedOrigin("http://127.0.0.1:3000");
        configuration.addAllowedOrigin("http://127.0.0.1:3001");
        configuration.addAllowedMethod("*");
        configuration.addAllowedHeader("*");
        configuration.setAllowCredentials(true);
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }
}
