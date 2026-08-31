CREATE TABLE book_topics (
    book_id UUID NOT NULL REFERENCES books (id) ON DELETE CASCADE,
    topic_id UUID NOT NULL REFERENCES topics (id) ON DELETE CASCADE,
    PRIMARY KEY (book_id, topic_id)
);

CREATE INDEX idx_book_topics_topic_id ON book_topics (topic_id);