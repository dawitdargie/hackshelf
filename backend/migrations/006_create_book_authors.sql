CREATE TABLE book_authors (
    book_id UUID NOT NULL REFERENCES books (id) ON DELETE CASCADE,
    author_id UUID NOT NULL REFERENCES authors (id) ON DELETE CASCADE,
    PRIMARY KEY (book_id, author_id)
);

CREATE INDEX idx_book_authors_author_id ON book_authors (author_id);