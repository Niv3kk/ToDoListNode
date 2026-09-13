CREATE TABLE IF NOT EXISTS tags (
    id CHAR(36) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    user_id CHAR(36) NOT NULL,

    CONSTRAINT fk_tags_user
        FOREIGN KEY (user_id)
        REFERENCES users(id)
);