package com.jobportal.api;

import com.jobportal.dto.AccountType;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Arrays;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Set;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/ahrm/v3/health")
public class HealthAPI {

    private static final Pattern ACCOUNT_VALUE_PATTERN = Pattern.compile("'([A-Z_]+)'");

    private final JdbcTemplate jdbcTemplate;

    public HealthAPI(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    @GetMapping("/account-types")
    public ResponseEntity<Map<String, Object>> accountTypesHealth() {
        Set<String> expected = Arrays.stream(AccountType.values())
                .map(Enum::name)
                .collect(Collectors.toCollection(HashSet::new));

        String constraintDefinition = jdbcTemplate.query(
                """
                SELECT pg_get_constraintdef(c.oid)
                FROM pg_constraint c
                JOIN pg_class t ON c.conrelid = t.oid
                WHERE c.conname = 'users_account_type_check'
                  AND t.relname = 'users'
                LIMIT 1
                """,
                rs -> rs.next() ? rs.getString(1) : null
        );

        Set<String> dbAllowedValues = extractConstraintValues(constraintDefinition);

        Set<String> missingInDb = new HashSet<>(expected);
        missingInDb.removeAll(dbAllowedValues);

        Set<String> extraInDb = new HashSet<>(dbAllowedValues);
        extraInDb.removeAll(expected);

        Map<String, Object> response = new LinkedHashMap<>();
        response.put("status", missingInDb.isEmpty() && extraInDb.isEmpty() ? "ok" : "mismatch");
        response.put("expectedEnumValues", expected);
        response.put("dbAllowedValues", dbAllowedValues);
        response.put("missingInDb", missingInDb);
        response.put("extraInDb", extraInDb);
        response.put("constraintDefinition", constraintDefinition);

        return ResponseEntity.ok(response);
    }

    private Set<String> extractConstraintValues(String constraintDefinition) {
        Set<String> values = new HashSet<>();
        if (constraintDefinition == null || constraintDefinition.isBlank()) {
            return values;
        }

        Matcher matcher = ACCOUNT_VALUE_PATTERN.matcher(constraintDefinition);
        while (matcher.find()) {
            values.add(matcher.group(1));
        }
        return values;
    }
}
