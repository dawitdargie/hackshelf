-- Chapters: hosted in-system book content. Every cataloged book is fully
-- readable inside HackShelf; the reader fetches one chapter per request.
CREATE TABLE chapters (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    book_id UUID NOT NULL REFERENCES books (id) ON DELETE CASCADE,
    slug VARCHAR(255) NOT NULL,
    title VARCHAR(500) NOT NULL,
    chapter_order INT NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),

    UNIQUE (book_id, slug),
    UNIQUE (book_id, chapter_order)
);

-- Hot path: TOC listing and chapter-by-order lookups for a book.
CREATE INDEX idx_chapters_book_order ON chapters (book_id, chapter_order);

-- Legacy: reading happens via hosted chapters, read_url is no longer required.
ALTER TABLE books ALTER COLUMN read_url DROP NOT NULL;
