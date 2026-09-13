CREATE TABLE IF NOT EXISTS categories (
    id CHAR(36) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    user_id CHAR(36) NOT NULL,

    CONSTRAINT fk_categories_user
        FOREIGN KEY (user_id)
        REFERENCES users(id),

    CONSTRAINT uq_categories_user_name
        UNIQUE (user_id, name)
);