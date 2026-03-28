package com.jobportal.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.annotation.PostConstruct;
import org.springframework.core.io.ClassPathResource;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.util.List;
import java.util.Map;

@Service
public class SearchService {

    private final JdbcTemplate jdbc;
    private final ObjectMapper objectMapper;

    public SearchService(JdbcTemplate jdbc, ObjectMapper objectMapper) {
        this.jdbc = jdbc;
        this.objectMapper = objectMapper;
    }

    @PostConstruct
    public void seedIfEmpty() throws IOException {
        Integer count = jdbc.queryForObject("SELECT COUNT(*) FROM search_content", Integer.class);
        if (count != null && count > 0) {
            return;
        }

        ClassPathResource resource = new ClassPathResource("data/search-data.json");
        Map<String, List<Map<String, Object>>> fileData = objectMapper.readValue(
                resource.getInputStream(),
                new TypeReference<Map<String, List<Map<String, Object>>>>() {});

        for (Map.Entry<String, List<Map<String, Object>>> entry : fileData.entrySet()) {
            String audience = entry.getKey();
            String itemsJson = objectMapper.writeValueAsString(entry.getValue());
            jdbc.update(
                    "INSERT INTO search_content (audience, items) VALUES (?, ?::jsonb)",
                    audience,
                    itemsJson);
        }
    }

    private List<Map<String, Object>> loadAudienceItems(String audience) {
        if ("candidates".equalsIgnoreCase(audience)) {
            return jdbc.queryForList(
                    """
                    SELECT id,
                       company,
                       role,
                       location,
                       salary,
                       logo_tone AS "logoTone"
                    FROM candidate_jobs
                    ORDER BY id
                    """);
        }

        String json = jdbc.query(
                "SELECT items::text FROM search_content WHERE audience = ?",
                rs -> rs.next() ? rs.getString(1) : "[]",
                audience);

        try {
            return objectMapper.readValue(json, new TypeReference<List<Map<String, Object>>>() {});
        } catch (IOException e) {
            throw new RuntimeException("Failed to deserialize search content from PostgreSQL", e);
        }
    }

    public Map<String, Object> search(String audience, String query) {
        String normalized = query.trim().toLowerCase();

        List<Map<String, Object>> results;
        if (normalized.isEmpty()) {
            results = List.of();
        } else {
            List<Map<String, Object>> collection = loadAudienceItems(audience);
            results = collection.stream()
                    .filter(item -> item.values().stream()
                            .filter(v -> v instanceof String)
                            .map(v -> ((String) v).toLowerCase())
                            .anyMatch(v -> v.contains(normalized)))
                    .toList();
        }

        return Map.of("audience", audience, "query", query, "results", results);
    }
}
