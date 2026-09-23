package admin

import (
	"net/http"
	"strings"

	"github.com/jackc/pgx/v5"

	"hackshelf/backend/internal/http/middleware"
)

// chapter is the admin-facing chapter representation (full content included).
type chapter struct {
	ID      string `json:"id,omitempty"`
	Slug    string `json:"slug"`
	Title   string `json:"title"`
	Order   int    `json:"chapter_order"`
	Content string `json:"content"`
}

// ListBooks handles GET /api/v1/admin/books: every book in editable form.
func (h *Handler) ListBooks(w http.ResponseWriter, r *http.Request) {
	type bookRow struct {
		ID           string   `json:"id"`
		Slug         string   `json:"slug"`
		Title        string   `json:"title"`
		Description  string   `json:"description"`
		Level        string   `json:"level"`
		ChapterCount int      `json:"chapter_count"`
		CreatedAt    string   `json:"created_at"`
		UpdatedAt    string   `json:"updated_at"`
		Authors      []string `json:"authors"`
		Categories   []string `json:"categories"`
		Topics       []string `json:"topics"`
	}

	rows, err := h.pool.Query(r.Context(), `
		SELECT b.id::text, b.slug, b.title, b.description, l.slug AS level,
		       COUNT(c.id)::int AS chapter_count, b.created_at::text, b.updated_at::text
		FROM books b
		JOIN levels l ON l.id = b.level_id
		LEFT JOIN chapters c ON c.book_id = b.id
		GROUP BY b.id, l.slug
		ORDER BY b.created_at DESC`)
	if err != nil {
		middleware.WriteError(w, 500, "INTERNAL_ERROR", "Something went wrong")
		return
	}

	books := []bookRow{}
	ids := map[string]int{}
	for rows.Next() {
		var b bookRow
		if err := rows.Scan(&b.ID, &b.Slug, &b.Title, &b.Description, &b.Level,
			&b.ChapterCount, &b.CreatedAt, &b.UpdatedAt); err != nil {
			rows.Close()
			middleware.WriteError(w, 500, "INTERNAL_ERROR", "Something went wrong")
			return
		}
		b.Authors, b.Categories, b.Topics = []string{}, []string{}, []string{}
		ids[b.ID] = len(books)
		books = append(books, b)
	}
	rows.Close()
	if err := rows.Err(); err != nil {
		middleware.WriteError(w, 500, "INTERNAL_ERROR", "Something went wrong")
		return
	}

	// Attach taxonomy slugs per book (three small indexed queries).
	assocSpecs := []struct {
		joinTable, itemTable, fkCol string
	}{
		{"book_authors", "authors", "author_id"},
		{"book_categories", "categories", "category_id"},
		{"book_topics", "topics", "topic_id"},
	}
	for _, spec := range assocSpecs {
		rows, err := h.pool.Query(r.Context(),
			`SELECT x.book_id::text, i.slug
			 FROM `+spec.joinTable+` x JOIN `+spec.itemTable+` i ON i.id = x.`+spec.fkCol+`
			 ORDER BY i.name`)
		if err != nil {
			middleware.WriteError(w, 500, "INTERNAL_ERROR", "Something went wrong")
			return
		}
		for rows.Next() {
			var bookID, slug string
			if err := rows.Scan(&bookID, &slug); err == nil {
				if idx, ok := ids[bookID]; ok {
					switch spec.itemTable {
					case "authors":
						books[idx].Authors = append(books[idx].Authors, slug)
					case "categories":
						books[idx].Categories = append(books[idx].Categories, slug)
					case "topics":
						books[idx].Topics = append(books[idx].Topics, slug)
					}
				}
			}
		}
		rows.Close()
	}

	writeData(w, http.StatusOK, books)
}

// GetBook handles GET /api/v1/admin/books/{bookId}: full meta + taxonomy +
// all chapters (with content), ready for the editor.
func (h *Handler) GetBook(w http.ResponseWriter, r *http.Request) {
	bookID := r.PathValue("bookId")
	if !uuidPattern.MatchString(bookID) {
		middleware.WriteError(w, 404, "BOOK_NOT_FOUND", "Book not found")
		return
	}

	var book struct {
		ID              string    `json:"id"`
		Slug            string    `json:"slug"`
		Title           string    `json:"title"`
		Description     string    `json:"description"`
		Level           string    `json:"level"`
		SourceURL       string    `json:"source_url"`
		License         string    `json:"license"`
		PublicationDate string    `json:"publication_date"`
		CoverURL        string    `json:"cover_url"`
		Authors         []string  `json:"authors"`
		Categories      []string  `json:"categories"`
		Topics          []string  `json:"topics"`
		Chapters        []chapter `json:"chapters"`
	}

	err := h.pool.QueryRow(r.Context(), `
		SELECT b.id::text, b.slug, b.title, b.description, l.slug,
		       b.source_url, COALESCE(b.license, ''),
		       COALESCE(TO_CHAR(b.publication_date, 'YYYY-MM-DD'), ''),
		       COALESCE(b.cover_url, '')
		FROM books b JOIN levels l ON l.id = b.level_id
		WHERE b.id = $1::uuid`, bookID).Scan(
		&book.ID, &book.Slug, &book.Title, &book.Description, &book.Level,
		&book.SourceURL, &book.License, &book.PublicationDate, &book.CoverURL)
	if err != nil {
		if err == pgx.ErrNoRows {
			middleware.WriteError(w, 404, "BOOK_NOT_FOUND", "Book not found")
			return
		}
		middleware.WriteError(w, 500, "INTERNAL_ERROR", "Something went wrong")
		return
	}

	for _, spec := range []struct{ joinTable, itemTable string }{
		{"book_authors", "authors"},
		{"book_categories", "categories"},
		{"book_topics", "topics"},
	} {
		col := itemTableToFK(spec.itemTable) + "_id"
		rows, err := h.pool.Query(r.Context(),
			`SELECT i.slug FROM `+spec.joinTable+` x JOIN `+spec.itemTable+` i ON i.id = x.`+col+
				` WHERE x.book_id = $1::uuid ORDER BY i.name`, bookID)
		if err != nil {
			middleware.WriteError(w, 500, "INTERNAL_ERROR", "Something went wrong")
			return
		}
		slugs := []string{}
		for rows.Next() {
			var slug string
			if err := rows.Scan(&slug); err == nil {
				slugs = append(slugs, slug)
			}
		}
		rows.Close()
		switch spec.itemTable {
		case "authors":
			book.Authors = slugs
		case "categories":
			book.Categories = slugs
		case "topics":
			book.Topics = slugs
		}
	}

	book.Chapters = []chapter{}
	rows, err := h.pool.Query(r.Context(), `
		SELECT id::text, slug, title, chapter_order, content
		FROM chapters WHERE book_id = $1::uuid ORDER BY chapter_order`, bookID)
	if err != nil {
		middleware.WriteError(w, 500, "INTERNAL_ERROR", "Something went wrong")
		return
	}
	defer rows.Close()
	for rows.Next() {
		var ch chapter
		if err := rows.Scan(&ch.ID, &ch.Slug, &ch.Title, &ch.Order, &ch.Content); err != nil {
			middleware.WriteError(w, 500, "INTERNAL_ERROR", "Something went wrong")
			return
		}
		book.Chapters = append(book.Chapters, ch)
	}

	writeData(w, http.StatusOK, book)
}

// itemTableToFK converts a join-item table name to the corresponding FK column name
// in the join table. E.g. "categories" -> "category", "authors" -> "author".
func itemTableToFK(itemTable string) string {
switch itemTable {
case "authors":
return "author"
case "categories":
return "category"
case "topics":
return "topic"
default:
return strings.TrimSuffix(strings.TrimSuffix(itemTable, "es"), "s")
}
}
