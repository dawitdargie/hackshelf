CREATE TABLE reading_progress (
    user_id UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    book_id UUID NOT NULL REFERENCES books (id) ON DELETE CASCADE,
    location TEXT NOT NULL,
    percentage NUMERIC(5,2) NOT NULL CHECK (percentage >= 0 AND percentage <= 100),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    PRIMARY KEY (user_id, book_id)
);

CREATE INDEX idx_reading_progress_book_id ON reading_progress (book_id);