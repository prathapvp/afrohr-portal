package com.jobportal.config;

import com.jobportal.dto.AccountType;
import jakarta.annotation.PostConstruct;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

import java.util.Arrays;
import java.util.HashSet;
import java.util.Set;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

@Component
public class AccountTypeConstraintHealthCheck {

    private static final Logger logger = LoggerFactory.getLogger(AccountTypeConstraintHealthCheck.class);
    private static final Pattern ACCOUNT_VALUE_PATTERN = Pattern.compile("'([A-Z_]+)'");

    private final JdbcTemplate jdbcTemplate;

    public AccountTypeConstraintHealthCheck(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    @PostConstruct
    public void validateUsersAccountTypeConstraint() {
        try {
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

            if (constraintDefinition == null || constraintDefinition.isBlank()) {
                    logger.warn("Constraint users_account_type_check was not found on users table. Recreating with expected values: {}",
                        expected);
                    recreateConstraint(expected);
                    logger.info("users_account_type_check recreated successfully.");
                    return;
            }

            Set<String> allowedByDb = extractConstraintValues(constraintDefinition);

            Set<String> missingInDb = new HashSet<>(expected);
            missingInDb.removeAll(allowedByDb);

            if (!missingInDb.isEmpty()) {
                logger.warn(
                        "users_account_type_check mismatch detected. Missing in DB constraint: {}. Constraint: {}. Recreating constraint.",
                        missingInDb,
                        constraintDefinition
                );
                    recreateConstraint(expected);
                    logger.info("users_account_type_check repaired successfully with values: {}", expected);
            } else {
                logger.info("users_account_type_check validated with account types: {}", allowedByDb);
            }
        } catch (Exception ex) {
            logger.warn("Could not validate users_account_type_check at startup: {}", ex.getMessage());
        }
    }

                private void recreateConstraint(Set<String> expectedValues) {
                String inClause = expectedValues.stream()
                    .sorted()
                    .map(value -> "'" + value + "'")
                    .collect(Collectors.joining(", "));

                jdbcTemplate.execute("ALTER TABLE users DROP CONSTRAINT IF EXISTS users_account_type_check");
                jdbcTemplate.execute("ALTER TABLE users ADD CONSTRAINT users_account_type_check CHECK (account_type IN (" + inClause + "))");
                }

    private Set<String> extractConstraintValues(String constraintDefinition) {
        Set<String> values = new HashSet<>();
        Matcher matcher = ACCOUNT_VALUE_PATTERN.matcher(constraintDefinition);
        while (matcher.find()) {
            values.add(matcher.group(1));
        }
        return values;
    }
}
