package books

// Level is a difficulty tier of the catalog taxonomy.
type Level struct {
	ID   int    `json:"id"`
	Name string `json:"name"`
	Slug string `json:"slug"`
}

// Author is a book author.
type Author struct {
	ID   string `json:"id"`
	Name string `json:"name"`
	Slug string `json:"slug"`
}

// Category is a high-level grouping of books.
type Category struct {
	ID   string `json:"id"`
	Name string `json:"name"`
	Slug string `json:"slug"`
}

// Topic is a specific subject tag of a book.
type Topic struct {
	ID   string `json:"id"`
	Name string `json:"name"`
	Slug string `json:"slug"`
}

// RatingSummary is the aggregate rating of a book.
type RatingSummary struct {
	Average float64 `json:"average"`
	Count   int     `json:"count"`
}

// BookSummary is the list-view representation of a book (API spec §10).
type BookSummary struct {
	ID       string        `json:"id"`
	Title    string        `json:"title"`
	Slug     string        `json:"slug"`
	CoverURL string        `json:"cover_url"`
	Level    Level         `json:"level"`
	Rating   RatingSummary `json:"rating"`
}

// Book is the detail-view representation of a book (API spec §11).
type Book struct {
	ID              string        `json:"id"`
	Title           string        `json:"title"`
	Slug            string        `json:"slug"`
	Description     string        `json:"description"`
	CoverURL        string        `json:"cover_url"`
	Authors         []Author      `json:"authors"`
	Level           Level         `json:"level"`
	Categories      []Category    `json:"categories"`
	Topics          []Topic       `json:"topics"`
	SourceURL       string        `json:"source_url"`
	License         string        `json:"license"`
	PublicationDate string        `json:"publication_date"`
	Rating          RatingSummary `json:"rating"`
}

// ChapterMeta is the TOC entry of a chapter (API spec §11b).
type ChapterMeta struct {
	ID           string `json:"id"`
	Slug         string `json:"slug"`
	Title        string `json:"title"`
	ChapterOrder int    `json:"chapter_order"`
}

// Chapter is a full hosted chapter (API spec §11b).
type Chapter struct {
	ID           string `json:"id"`
	Slug         string `json:"slug"`
	Title        string `json:"title"`
	ChapterOrder int    `json:"chapter_order"`
	Content      string `json:"content"`
}
