CREATE TABLE levels (
    id SMALLINT PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    slug VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    sort_order SMALLINT NOT NULL UNIQUE
);

CREATE INDEX idx_levels_slug ON levels (slug);