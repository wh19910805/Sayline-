ALTER TABLE user_settings
    MODIFY COLUMN show_chinese_write BOOLEAN NOT NULL DEFAULT TRUE,
    MODIFY COLUMN show_chinese_speak BOOLEAN NOT NULL DEFAULT TRUE;

UPDATE user_settings
SET show_chinese_write = TRUE,
    show_chinese_speak = TRUE;
