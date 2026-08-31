CREATE TABLE book_categories (
    book_id UUID NOT NULL REFERENCES books (id) ON DELETE CASCADE,
    category_id UUID NOT NULL REFERENCES categories (id) ON DELETE CASCADE,
    PRIMARY KEY (book_id, category_id)
);

CREATE INDEX idx_book_categories_category_id ON book_categories (category_id);