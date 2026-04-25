CREATE TABLE IF NOT EXISTS search_content (
    audience VARCHAR(100) PRIMARY KEY,
    items    JSONB        NOT NULL
);

ALTER TABLE IF EXISTS employer_subscriptions
    ADD COLUMN IF NOT EXISTS max_resume_views_per_month INTEGER NOT NULL DEFAULT 0;

ALTER TABLE IF EXISTS employer_subscriptions
    ADD COLUMN IF NOT EXISTS max_resume_downloads_per_month INTEGER NOT NULL DEFAULT 0;

ALTER TABLE IF EXISTS employer_subscriptions
    ADD COLUMN IF NOT EXISTS monthly_resume_views_used INTEGER NOT NULL DEFAULT 0;

ALTER TABLE IF EXISTS employer_subscriptions
    ADD COLUMN IF NOT EXISTS monthly_resume_downloads_used INTEGER NOT NULL DEFAULT 0;

ALTER TABLE IF EXISTS employer_subscriptions
    ADD COLUMN IF NOT EXISTS usage_window_start_at TIMESTAMP(6) WITHOUT TIME ZONE;

UPDATE employer_subscriptions
SET usage_window_start_at = date_trunc('month', now())
WHERE usage_window_start_at IS NULL;

ALTER TABLE IF EXISTS subscription_requests
    ADD COLUMN IF NOT EXISTS requested_plan VARCHAR(80);

ALTER TABLE IF EXISTS subscription_requests
    DROP CONSTRAINT IF EXISTS subscription_requests_request_type_check;

ALTER TABLE IF EXISTS subscription_requests
    ADD CONSTRAINT subscription_requests_request_type_check
    CHECK (request_type IN ('NEW', 'RENEWAL', 'UPGRADE'));

ALTER TABLE IF EXISTS jobs
    ADD COLUMN IF NOT EXISTS country VARCHAR(80);

ALTER TABLE IF EXISTS jobs
    ADD COLUMN IF NOT EXISTS currency VARCHAR(10);

ALTER TABLE IF EXISTS jobs
    ADD COLUMN IF NOT EXISTS job_code VARCHAR(40);

ALTER TABLE IF EXISTS users
        ADD COLUMN IF NOT EXISTS employer_role VARCHAR(20);

ALTER TABLE IF EXISTS users
    DROP CONSTRAINT IF EXISTS users_account_type_check;

ALTER TABLE IF EXISTS users
    ADD CONSTRAINT users_account_type_check
    CHECK (account_type IN ('APPLICANT', 'EMPLOYER', 'STUDENT', 'ADMIN'));

UPDATE users
SET employer_role = 'OWNER'
WHERE account_type = 'EMPLOYER'
    AND (employer_role IS NULL OR employer_role = '');

-- Audit column migrations for users table
ALTER TABLE IF EXISTS users
    ADD COLUMN IF NOT EXISTS created_at TIMESTAMP(6) WITHOUT TIME ZONE;
ALTER TABLE IF EXISTS users
    ADD COLUMN IF NOT EXISTS created_by BIGINT;
ALTER TABLE IF EXISTS users
    ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP(6) WITHOUT TIME ZONE;
ALTER TABLE IF EXISTS users
    ADD COLUMN IF NOT EXISTS updated_by BIGINT;

-- Backfill audit columns with current timestamp
UPDATE users SET created_at = NOW() WHERE created_at IS NULL;
UPDATE users SET updated_at = NOW() WHERE updated_at IS NULL;

-- Audit column migrations for profiles table
ALTER TABLE IF EXISTS profiles
    ADD COLUMN IF NOT EXISTS created_at TIMESTAMP(6) WITHOUT TIME ZONE;
ALTER TABLE IF EXISTS profiles
    ADD COLUMN IF NOT EXISTS created_by BIGINT;
ALTER TABLE IF EXISTS profiles
    ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP(6) WITHOUT TIME ZONE;
ALTER TABLE IF EXISTS profiles
    ADD COLUMN IF NOT EXISTS updated_by BIGINT;

-- Backfill audit columns with current timestamp
UPDATE profiles SET created_at = NOW() WHERE created_at IS NULL;
UPDATE profiles SET updated_at = NOW() WHERE updated_at IS NULL;

-- Audit column migrations for jobs table
ALTER TABLE IF EXISTS jobs
    ADD COLUMN IF NOT EXISTS created_at TIMESTAMP(6) WITHOUT TIME ZONE;
ALTER TABLE IF EXISTS jobs
    ADD COLUMN IF NOT EXISTS created_by BIGINT;
ALTER TABLE IF EXISTS jobs
    ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP(6) WITHOUT TIME ZONE;
ALTER TABLE IF EXISTS jobs
    ADD COLUMN IF NOT EXISTS updated_by BIGINT;

-- Backfill audit columns with current timestamp
UPDATE jobs SET created_at = NOW() WHERE created_at IS NULL;
UPDATE jobs SET updated_at = NOW() WHERE updated_at IS NULL;

-- Audit column migrations for notifications table
ALTER TABLE IF EXISTS notifications
    ADD COLUMN IF NOT EXISTS created_at TIMESTAMP(6) WITHOUT TIME ZONE;
ALTER TABLE IF EXISTS notifications
    ADD COLUMN IF NOT EXISTS created_by BIGINT;
ALTER TABLE IF EXISTS notifications
    ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP(6) WITHOUT TIME ZONE;
ALTER TABLE IF EXISTS notifications
    ADD COLUMN IF NOT EXISTS updated_by BIGINT;

-- Backfill audit columns with current timestamp
UPDATE notifications SET created_at = NOW() WHERE created_at IS NULL;
UPDATE notifications SET updated_at = NOW() WHERE updated_at IS NULL;
