CREATE TABLE saved_books (
    user_id UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    book_id UUID NOT NULL REFERENCES books (id) ON DELETE CASCADE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    PRIMARY KEY (user_id, book_id)
);

CREATE INDEX idx_saved_books_book_id ON saved_books (book_id);