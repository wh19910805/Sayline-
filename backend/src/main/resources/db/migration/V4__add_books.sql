CREATE TABLE books (
    id BIGINT NOT NULL AUTO_INCREMENT,
    category_id BIGINT NOT NULL,
    title VARCHAR(120) NOT NULL,
    description VARCHAR(1000),
    cover_object_key VARCHAR(255),
    theme_color_primary VARCHAR(20),
    theme_color_secondary VARCHAR(20),
    sort_order INT NOT NULL DEFAULT 0,
    visible BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP(6) NOT NULL,
    updated_at TIMESTAMP(6) NOT NULL,
    PRIMARY KEY (id),
    CONSTRAINT fk_books_category FOREIGN KEY (category_id) REFERENCES course_categories (id),
    INDEX idx_books_category_sort (category_id, visible, sort_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE book_favorites (
    id BIGINT NOT NULL AUTO_INCREMENT,
    user_id BIGINT NOT NULL,
    book_id BIGINT NOT NULL,
    created_at TIMESTAMP(6) NOT NULL,
    PRIMARY KEY (id),
    CONSTRAINT uk_book_favorite UNIQUE (user_id, book_id),
    CONSTRAINT fk_book_favorites_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
    CONSTRAINT fk_book_favorites_book FOREIGN KEY (book_id) REFERENCES books (id) ON DELETE CASCADE,
    INDEX idx_book_favorites_user_created (user_id, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

ALTER TABLE courses ADD COLUMN book_id BIGINT NULL;

INSERT INTO books (category_id, title, description, cover_object_key, theme_color_primary, theme_color_secondary, sort_order, visible, created_at, updated_at)
SELECT id, name, description, cover_object_key, theme_color_primary, theme_color_secondary, sort_order, visible, created_at, updated_at
FROM course_categories;

UPDATE courses c
SET c.book_id = (SELECT b.id FROM books b WHERE b.category_id = c.category_id);

ALTER TABLE courses MODIFY COLUMN book_id BIGINT NOT NULL;
ALTER TABLE courses ADD CONSTRAINT fk_courses_book FOREIGN KEY (book_id) REFERENCES books (id);
ALTER TABLE courses ADD INDEX idx_courses_book_sort (book_id, status, sort_order);
