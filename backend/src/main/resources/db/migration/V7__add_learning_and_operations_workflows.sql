ALTER TABLE user_settings
    ADD COLUMN reminder_enabled BOOLEAN NOT NULL DEFAULT FALSE,
    ADD COLUMN reminder_time TIME NOT NULL DEFAULT '20:00:00';

ALTER TABLE refresh_sessions
    ADD COLUMN user_agent VARCHAR(255),
    ADD COLUMN ip_address VARCHAR(64);

CREATE TABLE review_cue_states (
    id BIGINT NOT NULL AUTO_INCREMENT,
    user_id BIGINT NOT NULL,
    cue_id BIGINT NOT NULL,
    status VARCHAR(20) NOT NULL,
    next_review_at TIMESTAMP(6) NULL,
    created_at TIMESTAMP(6) NOT NULL,
    updated_at TIMESTAMP(6) NOT NULL,
    PRIMARY KEY (id),
    CONSTRAINT uk_review_cue_state UNIQUE (user_id, cue_id),
    CONSTRAINT fk_review_cue_state_user FOREIGN KEY (user_id) REFERENCES users (id),
    CONSTRAINT fk_review_cue_state_cue FOREIGN KEY (cue_id) REFERENCES subtitle_cues (id)
);

CREATE INDEX idx_review_cue_state_due
    ON review_cue_states (user_id, status, next_review_at);

CREATE TABLE content_import_jobs (
    id BIGINT NOT NULL AUTO_INCREMENT,
    type VARCHAR(20) NOT NULL,
    status VARCHAR(20) NOT NULL,
    book_id BIGINT NULL,
    created_by BIGINT NULL,
    total_count INT NOT NULL,
    success_count INT NOT NULL,
    skipped_count INT NOT NULL,
    failed_count INT NOT NULL,
    report_json LONGTEXT NOT NULL,
    created_at TIMESTAMP(6) NOT NULL,
    updated_at TIMESTAMP(6) NOT NULL,
    PRIMARY KEY (id),
    CONSTRAINT fk_content_import_book FOREIGN KEY (book_id) REFERENCES books (id),
    CONSTRAINT fk_content_import_user FOREIGN KEY (created_by) REFERENCES users (id)
);

CREATE INDEX idx_content_import_created
    ON content_import_jobs (created_at);

CREATE TABLE admin_audit_logs (
    id BIGINT NOT NULL AUTO_INCREMENT,
    actor_id BIGINT NULL,
    action VARCHAR(60) NOT NULL,
    entity_type VARCHAR(60) NOT NULL,
    entity_id VARCHAR(80) NULL,
    detail VARCHAR(2000) NULL,
    created_at TIMESTAMP(6) NOT NULL,
    updated_at TIMESTAMP(6) NOT NULL,
    PRIMARY KEY (id),
    CONSTRAINT fk_admin_audit_actor FOREIGN KEY (actor_id) REFERENCES users (id)
);

CREATE INDEX idx_admin_audit_created
    ON admin_audit_logs (created_at);

CREATE TABLE password_reset_tokens (
    id BIGINT NOT NULL AUTO_INCREMENT,
    user_id BIGINT NOT NULL,
    token_hash VARCHAR(64) NOT NULL,
    expires_at TIMESTAMP(6) NOT NULL,
    used_at TIMESTAMP(6) NULL,
    created_at TIMESTAMP(6) NOT NULL,
    updated_at TIMESTAMP(6) NOT NULL,
    PRIMARY KEY (id),
    CONSTRAINT fk_password_reset_user FOREIGN KEY (user_id) REFERENCES users (id)
);

CREATE INDEX idx_password_reset_user
    ON password_reset_tokens (user_id, expires_at);
