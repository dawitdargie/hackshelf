-- Full-text search infrastructure for the books catalog (Phase 8).
-- Generated tsvector over title + description, maintained automatically.
CREATE EXTENSION IF NOT EXISTS pg_trgm;

ALTER TABLE books
    ADD COLUMN search_vec tsvector GENERATED ALWAYS AS (
        to_tsvector('english', coalesce(title, '') || ' ' || coalesce(description, ''))
    ) STORED;

CREATE INDEX idx_books_search_vec ON books USING GIN (search_vec);

-- Trigram indexes so the ILIKE fallback avoids sequential scans.
CREATE INDEX idx_books_title_trgm ON books USING GIN (title gin_trgm_ops);
CREATE INDEX idx_books_description_trgm ON books USING GIN (description gin_trgm_ops);
