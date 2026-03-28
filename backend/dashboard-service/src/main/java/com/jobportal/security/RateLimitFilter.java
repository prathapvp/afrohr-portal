package com.jobportal.security;

import java.io.IOException;
import java.time.Instant;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicInteger;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

@Component
public class RateLimitFilter extends OncePerRequestFilter {

    private static final int WINDOW_SECONDS = 60;
    private static final int MAX_REQUESTS = 120;

    private static class Bucket {
        private AtomicInteger count = new AtomicInteger(0);
        private volatile long windowStart = Instant.now().getEpochSecond();
    }

    private final Map<String, Bucket> buckets = new ConcurrentHashMap<>();

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {

        String key = request.getRemoteAddr();
        Bucket bucket = buckets.computeIfAbsent(key, k -> new Bucket());

        long now = Instant.now().getEpochSecond();
        if (now - bucket.windowStart >= WINDOW_SECONDS) {
            bucket.windowStart = now;
            bucket.count.set(0);
        }

        if (bucket.count.incrementAndGet() > MAX_REQUESTS) {
            response.setStatus(HttpStatus.TOO_MANY_REQUESTS.value());
            response.getWriter().write("rate.limit.exceeded");
            return;
        }

        filterChain.doFilter(request, response);
    }
}
