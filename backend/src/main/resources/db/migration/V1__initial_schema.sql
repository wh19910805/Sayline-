CREATE TABLE users (
    id BIGINT NOT NULL AUTO_INCREMENT,
    phone VARCHAR(20) NOT NULL,
    password_hash VARCHAR(100) NOT NULL,
    nickname VARCHAR(50) NOT NULL,
    avatar_object_key VARCHAR(255),
    role VARCHAR(20) NOT NULL,
    status VARCHAR(20) NOT NULL,
    last_login_at TIMESTAMP(6) NULL,
    created_at TIMESTAMP(6) NOT NULL,
    updated_at TIMESTAMP(6) NOT NULL,
    PRIMARY KEY (id),
    CONSTRAINT uk_users_phone UNIQUE (phone)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE course_categories (
    id BIGINT NOT NULL AUTO_INCREMENT,
    name VARCHAR(50) NOT NULL,
    description VARCHAR(300),
    cover_object_key VARCHAR(255),
    theme_color_primary VARCHAR(20),
    theme_color_secondary VARCHAR(20),
    sort_order INT NOT NULL DEFAULT 0,
    visible BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP(6) NOT NULL,
    updated_at TIMESTAMP(6) NOT NULL,
    PRIMARY KEY (id),
    CONSTRAINT uk_course_categories_name UNIQUE (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE courses (
    id BIGINT NOT NULL AUTO_INCREMENT,
    category_id BIGINT NOT NULL,
    title VARCHAR(120) NOT NULL,
    description VARCHAR(1000),
    cover_object_key VARCHAR(255),
    audio_object_key VARCHAR(255),
    subtitle_object_key VARCHAR(255),
    duration_ms BIGINT NOT NULL DEFAULT 0,
    theme_color_primary VARCHAR(20),
    theme_color_secondary VARCHAR(20),
    status VARCHAR(20) NOT NULL,
    sort_order INT NOT NULL DEFAULT 0,
    created_by BIGINT,
    published_at TIMESTAMP(6) NULL,
    created_at TIMESTAMP(6) NOT NULL,
    updated_at TIMESTAMP(6) NOT NULL,
    PRIMARY KEY (id),
    CONSTRAINT fk_courses_category FOREIGN KEY (category_id) REFERENCES course_categories (id),
    CONSTRAINT fk_courses_created_by FOREIGN KEY (created_by) REFERENCES users (id),
    INDEX idx_courses_category_sort (category_id, status, sort_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE subtitle_cues (
    id BIGINT NOT NULL AUTO_INCREMENT,
    course_id BIGINT NOT NULL,
    sequence_no INT NOT NULL,
    start_ms BIGINT NOT NULL,
    end_ms BIGINT NOT NULL,
    english_text VARCHAR(2000) NOT NULL,
    chinese_text VARCHAR(2000) NOT NULL,
    PRIMARY KEY (id),
    CONSTRAINT fk_subtitle_cues_course FOREIGN KEY (course_id) REFERENCES courses (id) ON DELETE CASCADE,
    CONSTRAINT uk_course_cue_sequence UNIQUE (course_id, sequence_no),
    INDEX idx_subtitle_cues_timing (course_id, start_ms)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE user_settings (
    id BIGINT NOT NULL AUTO_INCREMENT,
    user_id BIGINT NOT NULL,
    font_scale DECIMAL(3,2) NOT NULL DEFAULT 1.00,
    subtitle_color VARCHAR(20) NOT NULL DEFAULT '#F8F2E8',
    show_chinese_listen BOOLEAN NOT NULL DEFAULT TRUE,
    show_chinese_read BOOLEAN NOT NULL DEFAULT TRUE,
    show_chinese_write BOOLEAN NOT NULL DEFAULT FALSE,
    show_chinese_speak BOOLEAN NOT NULL DEFAULT FALSE,
    default_category_id BIGINT,
    created_at TIMESTAMP(6) NOT NULL,
    updated_at TIMESTAMP(6) NOT NULL,
    PRIMARY KEY (id),
    CONSTRAINT uk_user_settings_user UNIQUE (user_id),
    CONSTRAINT fk_user_settings_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
    CONSTRAINT fk_user_settings_default_category FOREIGN KEY (default_category_id) REFERENCES course_categories (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE user_interests (
    id BIGINT NOT NULL AUTO_INCREMENT,
    user_id BIGINT NOT NULL,
    category_id BIGINT NOT NULL,
    sort_order INT NOT NULL DEFAULT 0,
    created_at TIMESTAMP(6) NOT NULL,
    PRIMARY KEY (id),
    CONSTRAINT uk_user_interest UNIQUE (user_id, category_id),
    CONSTRAINT fk_user_interests_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
    CONSTRAINT fk_user_interests_category FOREIGN KEY (category_id) REFERENCES course_categories (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE refresh_sessions (
    id VARCHAR(36) NOT NULL,
    user_id BIGINT NOT NULL,
    token_hash VARCHAR(64) NOT NULL,
    expires_at TIMESTAMP(6) NOT NULL,
    created_at TIMESTAMP(6) NOT NULL,
    last_used_at TIMESTAMP(6) NULL,
    revoked_at TIMESTAMP(6) NULL,
    PRIMARY KEY (id),
    CONSTRAINT uk_refresh_sessions_token UNIQUE (token_hash),
    CONSTRAINT fk_refresh_sessions_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
    INDEX idx_refresh_sessions_user (user_id, expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE course_favorites (
    id BIGINT NOT NULL AUTO_INCREMENT,
    user_id BIGINT NOT NULL,
    course_id BIGINT NOT NULL,
    created_at TIMESTAMP(6) NOT NULL,
    PRIMARY KEY (id),
    CONSTRAINT uk_course_favorite UNIQUE (user_id, course_id),
    CONSTRAINT fk_course_favorites_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
    CONSTRAINT fk_course_favorites_course FOREIGN KEY (course_id) REFERENCES courses (id) ON DELETE CASCADE,
    INDEX idx_course_favorites_user_created (user_id, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE learning_records (
    id BIGINT NOT NULL AUTO_INCREMENT,
    user_id BIGINT NOT NULL,
    course_id BIGINT NOT NULL,
    last_mode VARCHAR(20) NOT NULL,
    last_cue_id BIGINT,
    last_position_ms BIGINT NOT NULL DEFAULT 0,
    listen_progress INT NOT NULL DEFAULT 0,
    read_progress INT NOT NULL DEFAULT 0,
    write_progress INT NOT NULL DEFAULT 0,
    speak_progress INT NOT NULL DEFAULT 0,
    listen_confirmed BOOLEAN NOT NULL DEFAULT FALSE,
    read_confirmed BOOLEAN NOT NULL DEFAULT FALSE,
    write_confirmed BOOLEAN NOT NULL DEFAULT FALSE,
    speak_confirmed BOOLEAN NOT NULL DEFAULT FALSE,
    completed_at TIMESTAMP(6) NULL,
    total_study_ms BIGINT NOT NULL DEFAULT 0,
    last_studied_at TIMESTAMP(6) NULL,
    created_at TIMESTAMP(6) NOT NULL,
    updated_at TIMESTAMP(6) NOT NULL,
    PRIMARY KEY (id),
    CONSTRAINT uk_learning_record UNIQUE (user_id, course_id),
    CONSTRAINT fk_learning_records_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
    CONSTRAINT fk_learning_records_course FOREIGN KEY (course_id) REFERENCES courses (id) ON DELETE CASCADE,
    CONSTRAINT fk_learning_records_last_cue FOREIGN KEY (last_cue_id) REFERENCES subtitle_cues (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE learning_cue_progress (
    id BIGINT NOT NULL AUTO_INCREMENT,
    user_id BIGINT NOT NULL,
    course_id BIGINT NOT NULL,
    cue_id BIGINT NOT NULL,
    heard BOOLEAN NOT NULL DEFAULT FALSE,
    `read` BOOLEAN NOT NULL DEFAULT FALSE,
    written BOOLEAN NOT NULL DEFAULT FALSE,
    spoken BOOLEAN NOT NULL DEFAULT FALSE,
    updated_at TIMESTAMP(6) NOT NULL,
    PRIMARY KEY (id),
    CONSTRAINT uk_user_cue_progress UNIQUE (user_id, cue_id),
    CONSTRAINT fk_cue_progress_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
    CONSTRAINT fk_cue_progress_course FOREIGN KEY (course_id) REFERENCES courses (id) ON DELETE CASCADE,
    CONSTRAINT fk_cue_progress_cue FOREIGN KEY (cue_id) REFERENCES subtitle_cues (id) ON DELETE CASCADE,
    INDEX idx_cue_progress_course (user_id, course_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE dictation_attempts (
    id BIGINT NOT NULL AUTO_INCREMENT,
    user_id BIGINT NOT NULL,
    course_id BIGINT NOT NULL,
    cue_id BIGINT NOT NULL,
    answer_text VARCHAR(2000) NOT NULL,
    is_correct BOOLEAN NOT NULL,
    created_at TIMESTAMP(6) NOT NULL,
    PRIMARY KEY (id),
    CONSTRAINT fk_dictation_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
    CONSTRAINT fk_dictation_course FOREIGN KEY (course_id) REFERENCES courses (id) ON DELETE CASCADE,
    CONSTRAINT fk_dictation_cue FOREIGN KEY (cue_id) REFERENCES subtitle_cues (id) ON DELETE CASCADE,
    INDEX idx_dictation_user_created (user_id, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE learning_daily_stats (
    id BIGINT NOT NULL AUTO_INCREMENT,
    user_id BIGINT NOT NULL,
    course_id BIGINT NOT NULL,
    stat_date DATE NOT NULL,
    session_count INT NOT NULL DEFAULT 0,
    study_ms BIGINT NOT NULL DEFAULT 0,
    updated_at TIMESTAMP(6) NOT NULL,
    PRIMARY KEY (id),
    CONSTRAINT uk_daily_stat UNIQUE (user_id, course_id, stat_date),
    CONSTRAINT fk_daily_stats_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
    CONSTRAINT fk_daily_stats_course FOREIGN KEY (course_id) REFERENCES courses (id) ON DELETE CASCADE,
    INDEX idx_daily_stats_user_date (user_id, stat_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE study_sessions (
    id VARCHAR(36) NOT NULL,
    user_id BIGINT NOT NULL,
    course_id BIGINT NOT NULL,
    started_at TIMESTAMP(6) NOT NULL,
    last_active_at TIMESTAMP(6) NOT NULL,
    active_ms BIGINT NOT NULL DEFAULT 0,
    counted BOOLEAN NOT NULL DEFAULT FALSE,
    PRIMARY KEY (id),
    CONSTRAINT fk_study_sessions_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
    CONSTRAINT fk_study_sessions_course FOREIGN KEY (course_id) REFERENCES courses (id) ON DELETE CASCADE,
    INDEX idx_study_sessions_user_active (user_id, last_active_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
