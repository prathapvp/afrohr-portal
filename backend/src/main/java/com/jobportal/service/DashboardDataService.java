package com.jobportal.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.annotation.PostConstruct;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Objects;

@Service
public class DashboardDataService {

    private final ObjectMapper objectMapper;
    private Map<String, Object> dashboardData = Collections.emptyMap();

    public DashboardDataService(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
    }

    @PostConstruct
    public void loadDashboardData() {
        ClassPathResource resource = new ClassPathResource("data/dashboard-data.json");
        try {
            dashboardData = objectMapper.readValue(resource.getInputStream(), new TypeReference<Map<String, Object>>() {});
        } catch (IOException e) {
            throw new IllegalStateException("Failed to load dashboard data from classpath", e);
        }
    }

    public Map<String, Object> getDashboardRoot() {
        return dashboardData;
    }

    public List<String> getAudienceIds() {
        List<Map<String, Object>> audiences = getMapList(dashboardData, "audiences");
        return audiences.stream()
                .map(a -> asString(a.get("id")))
                .filter(id -> !id.isBlank())
                .toList();
    }

    public Map<String, Object> getDashboardByAudience(String audience) {
        Map<String, Object> dashboards = getMap(dashboardData, "dashboards");
        Map<String, Object> selected = getMap(dashboards, normalizeAudience(audience));

        Map<String, Object> response = new LinkedHashMap<>();
        response.put("audience", normalizeAudience(audience));
        response.put("dashboard", selected);
        return response;
    }

    public Map<String, Object> searchCollection(String audience, String query) {
        String selectedAudience = normalizeAudience(audience);
        String normalizedQuery = query == null ? "" : query.trim().toLowerCase(Locale.ROOT);
        if (normalizedQuery.isBlank()) {
            return Map.of("audience", selectedAudience, "query", query == null ? "" : query, "results", List.of());
        }

        List<Map<String, Object>> collection = getSearchCollection(selectedAudience);
        List<Map<String, Object>> results = collection.stream()
                .filter(item -> item.values().stream()
                        .filter(Objects::nonNull)
                        .map(this::asString)
                        .map(v -> v.toLowerCase(Locale.ROOT))
                        .anyMatch(v -> v.contains(normalizedQuery)))
                .toList();

        return Map.of("audience", selectedAudience, "query", query == null ? "" : query, "results", results);
    }

    private List<Map<String, Object>> getSearchCollection(String audience) {
        Map<String, Object> dashboards = getMap(dashboardData, "dashboards");

        if ("students".equals(audience)) {
            Map<String, Object> students = getMap(dashboards, "students");
            Map<String, Object> careers = getMap(students, "careers");
            return getMapList(careers, "items");
        }

        if ("candidates".equals(audience)) {
            Map<String, Object> candidates = getMap(dashboards, "candidates");
            Map<String, Object> jobs = getMap(candidates, "jobs");
            return getMapList(jobs, "items");
        }

        Map<String, Object> employers = getMap(dashboards, "employers");
        Map<String, Object> verification = getMap(employers, "verification");
        return getMapList(verification, "items");
    }

    private String normalizeAudience(String audience) {
        if (audience == null) {
            return "candidates";
        }

        String normalized = audience.trim().toLowerCase(Locale.ROOT);
        if (normalized.isBlank()) {
            return "candidates";
        }

        return switch (normalized) {
            case "candidates", "employers", "students" -> normalized;
            default -> "candidates";
        };
    }

    @SuppressWarnings("unchecked")
    private Map<String, Object> getMap(Map<String, Object> source, String key) {
        Object value = source.get(key);
        if (value instanceof Map<?, ?> valueMap) {
            return (Map<String, Object>) valueMap;
        }
        return Collections.emptyMap();
    }

    @SuppressWarnings("unchecked")
    private List<Map<String, Object>> getMapList(Map<String, Object> source, String key) {
        Object value = source.get(key);
        if (value instanceof List<?> list) {
            return list.stream()
                    .filter(item -> item instanceof Map<?, ?>)
                    .map(item -> (Map<String, Object>) item)
                    .toList();
        }
        return List.of();
    }

    private String asString(Object value) {
        return value == null ? "" : String.valueOf(value);
    }
}
