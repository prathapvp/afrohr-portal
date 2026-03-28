CREATE TABLE IF NOT EXISTS search_content (
    audience VARCHAR(100) PRIMARY KEY,
    items    JSONB        NOT NULL
);
