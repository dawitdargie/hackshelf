CREATE TABLE books (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(500) NOT NULL,
    slug VARCHAR(500) NOT NULL UNIQUE,
    description TEXT NOT NULL,
    cover_url TEXT,
    level_id SMALLINT NOT NULL REFERENCES levels (id),
    source_url TEXT NOT NULL,
    read_url TEXT NOT NULL,
    license VARCHAR(255),
    publication_date DATE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_books_slug ON books (slug);
CREATE INDEX idx_books_level_id ON books (level_id);
CREATE INDEX idx_books_created_at ON books (created_at);