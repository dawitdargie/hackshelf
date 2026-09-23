package admin

import (
"context"
"errors"
"fmt"
"net/http"
"strconv"
"strings"
"time"

"github.com/jackc/pgx/v5"
"github.com/jackc/pgx/v5/pgtype"

"hackshelf/backend/internal/http/middleware"
)

// CreateBook handles POST /api/v1/admin/books: create a new hosted book (upsert
// by slug), replacing its chapters in a single transaction.
func (h *Handler) CreateBook(w http.ResponseWriter, r *http.Request) {
h.upsertBook(w, r, false)
}

// UpdateBook handles PUT /api/v1/admin/books/{bookId}: overwrite an existing
// book's meta and chapters (full replacement).
func (h *Handler) UpdateBook(w http.ResponseWriter, r *http.Request) {
bookID := r.PathValue("bookId")
if !uuidPattern.MatchString(bookID) {
middleware.WriteError(w, 404, "BOOK_NOT_FOUND", "Book not found")
return
}
h.upsertBook(w, r, true)
}

// DeleteBook handles DELETE /api/v1/admin/books/{bookId}: removes the book
// and all related data (chapters, bookmarks, progress) via CASCADE.
func (h *Handler) DeleteBook(w http.ResponseWriter, r *http.Request) {
bookID := r.PathValue("bookId")
if !uuidPattern.MatchString(bookID) {
middleware.WriteError(w, 404, "BOOK_NOT_FOUND", "Book not found")
return
}
ctx := r.Context()
var slug string
err := h.pool.QueryRow(ctx, `SELECT slug FROM books WHERE id = $1::uuid`, bookID).Scan(&slug)
if err != nil {
if err == pgx.ErrNoRows {
middleware.WriteError(w, 404, "BOOK_NOT_FOUND", "Book not found")
return
}
middleware.WriteError(w, 500, "INTERNAL_ERROR", "Something went wrong")
return
}
_, err = h.pool.Exec(ctx, `DELETE FROM books WHERE id = $1::uuid`, bookID)
if err != nil {
middleware.WriteError(w, 500, "INTERNAL_ERROR", "Something went wrong")
return
}
writeData(w, http.StatusNoContent, map[string]interface{}{"deleted": slug})
}

// chapterInput is the admin-facing chapter payload (subset of full chapter).
type chapterInput struct {
Slug    string `json:"slug"`
Title   string `json:"title"`
Content string `json:"content"`
}

// sanitizeChapters validates and normalizes chapter input: drops blanks,
// ensures content is non-empty, fills missing slugs/titles.
func sanitizeChapters(in []chapterInput) []chapterInput {
out := make([]chapterInput, 0, len(in))
for _, ch := range in {
if strings.TrimSpace(ch.Content) == "" {
continue
}
ch.Slug = strings.TrimSpace(ch.Slug)
ch.Title = strings.TrimSpace(ch.Title)
ch.Content = strings.TrimSpace(ch.Content)
out = append(out, ch)
}
return out
}

// levelIDBySlug resolves a level slug to its id, or returns an error.
func (h *Handler) levelIDBySlug(ctx context.Context, slug string) (int32, error) {
var id int32
err := h.pool.QueryRow(ctx, `SELECT id FROM levels WHERE slug = $1::text`, slug).Scan(&id)
return id, err
}

// extractFirstHeading returns the first Markdown H1/H2 heading or empty.
func extractFirstHeading(content string) string {
for _, line := range strings.Split(content, "\n") {
trimmed := strings.TrimSpace(line)
if strings.HasPrefix(trimmed, "## ") {
return strings.TrimSpace(strings.TrimPrefix(trimmed, "## "))
}
if strings.HasPrefix(trimmed, "# ") {
return strings.TrimSpace(strings.TrimPrefix(trimmed, "# "))
}
}
return ""
}

// parseDate converts YYYY-MM-DD to a pgx-compatible date; invalid input -> nil.
func parseDate(s string) interface{} {
s = strings.TrimSpace(s)
if s == "" {
return nil
}
t, err := time.Parse("2006-01-02", s)
if err != nil {
return nil
}
return pgtype.Date{Time: t, Valid: true}
}

// resolveTaxonomyIDs upserts taxonomy rows and returns their ids.
func (h *Handler) resolveTaxonomyIDs(ctx context.Context, tx pgx.Tx, joinTable, itemTable string, slugs []string) ([]string, error) {
if len(slugs) == 0 {
return nil, nil
}
ids := make([]string, 0, len(slugs))
for _, slug := range slugs {
var id string
switch itemTable {
case "authors":
err := tx.QueryRow(ctx, `
INSERT INTO authors (name, slug, bio) VALUES ($1, $2, NULL)
ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name
RETURNING id::text`, slug, slug).Scan(&id)
if err != nil {
return nil, err
}
case "categories":
err := tx.QueryRow(ctx, `
INSERT INTO categories (name, slug, description) VALUES ($1, $2, NULL)
ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name
RETURNING id::text`, slug, slug).Scan(&id)
if err != nil {
return nil, err
}
case "topics":
err := tx.QueryRow(ctx, `
INSERT INTO topics (name, slug) VALUES ($1, $2)
ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name
RETURNING id::text`, slug, slug).Scan(&id)
if err != nil {
return nil, err
}
}
ids = append(ids, id)
}
return ids, nil
}

// replaceAssociations replaces all join-table links for a book to a set of taxonomy ids.
func (h *Handler) replaceAssociations(ctx context.Context, tx pgx.Tx, joinTable, fkCol, bookID string, ids []string) {
if len(ids) == 0 {
tx.Exec(ctx, `DELETE FROM `+joinTable+` WHERE book_id = $1::uuid`, bookID)
return
}
args := make([]interface{}, 1+len(ids))
args[0] = bookID
for i, id := range ids {
args[i+1] = id
}
tx.Exec(ctx, `DELETE FROM `+joinTable+` WHERE book_id = $1::uuid`, bookID)
ph := make([]string, len(ids))
for i := range ids {
ph[i] = fmt.Sprintf("$%d", i+2)
}
tx.Exec(ctx, fmt.Sprintf(`INSERT INTO %s (book_id, %s) SELECT $1::uuid, unnest(ARRAY[%s::uuid])`, joinTable, fkCol, strings.Join(ph, ",")), args...)
}

// upsertBook creates or updates a book + its chapters in one transaction.
func (h *Handler) upsertBook(w http.ResponseWriter, r *http.Request, existing bool) {
var req struct {
Title           string   `json:"title"`
Slug            string   `json:"slug"`
Description     string   `json:"description"`
Level           string   `json:"level"`
Authors         []string `json:"authors"`
Categories      []string `json:"categories"`
Topics          []string `json:"topics"`
SourceURL       string   `json:"source_url"`
License         string   `json:"license"`
PublicationDate string   `json:"publication_date"`
CoverURL        string   `json:"cover_url"`
Chapters        []chapterInput
}
if err := decodeBody(w, r, &req); err != nil {
return
}

title := strings.TrimSpace(req.Title)
if title == "" {
middleware.WriteError(w, 422, "VALIDATION_ERROR", "title is required")
return
}
if len(title) > 500 {
middleware.WriteError(w, 422, "VALIDATION_ERROR", "title is too long")
return
}

slug := slugify(req.Slug)
if slug == "" {
slug = slugify(title)
}
if slug == "" {
middleware.WriteError(w, 422, "VALIDATION_ERROR", "slug must contain letters or digits")
return
}
if !slugPattern.MatchString(slug) {
middleware.WriteError(w, 422, "VALIDATION_ERROR", "slug may only contain lowercase letters, digits and hyphens")
return
}
if len(slug) > 500 {
middleware.WriteError(w, 422, "VALIDATION_ERROR", "slug is too long")
return
}

levelSlug := strings.TrimSpace(req.Level)
if levelSlug == "" {
middleware.WriteError(w, 422, "VALIDATION_ERROR", "level is required")
return
}
levelID, err := h.levelIDBySlug(r.Context(), levelSlug)
if err != nil {
middleware.WriteError(w, 422, "VALIDATION_ERROR", "invalid level: "+levelSlug)
return
}

chapterInputs := sanitizeChapters(req.Chapters)
if len(chapterInputs) == 0 {
middleware.WriteError(w, 422, "VALIDATION_ERROR", "at least one chapter is required")
return
}

ctx := r.Context()
tx, err := h.pool.Begin(ctx)
if err != nil {
middleware.WriteError(w, 500, "INTERNAL_ERROR", "Something went wrong")
return
}
defer tx.Rollback(ctx)

// --- Resolve or validate the book slug ---
var bookIDValue string
var existingSlug string
if existing {
err := tx.QueryRow(ctx, `SELECT id::text, slug FROM books WHERE id = $1::uuid`, r.PathValue("bookId")).Scan(&bookIDValue, &existingSlug)
if err != nil {
if err == pgx.ErrNoRows {
middleware.WriteError(w, 404, "BOOK_NOT_FOUND", "Book not found")
return
}
middleware.WriteError(w, 500, "INTERNAL_ERROR", "Something went wrong")
return
}
if slug != existingSlug {
var dup int
err := tx.QueryRow(ctx, `SELECT 1 FROM books WHERE slug = $1::text AND id <> $2::uuid`, slug, bookIDValue).Scan(&dup)
if err == nil {
middleware.WriteError(w, 409, "SLUG_CONFLICT", "Another book already uses this slug")
return
} else if err != nil && !errors.Is(err, pgx.ErrNoRows) {
middleware.WriteError(w, 500, "INTERNAL_ERROR", "Something went wrong")
return
}
}
} else {
var dup int
err := tx.QueryRow(ctx, `SELECT 1 FROM books WHERE slug = $1::text`, slug).Scan(&dup)
if err == nil {
middleware.WriteError(w, 409, "SLUG_CONFLICT", "A book with this slug already exists")
return
} else if err != nil && !errors.Is(err, pgx.ErrNoRows) {
middleware.WriteError(w, 500, "INTERNAL_ERROR", "Something went wrong")
return
}
}

// --- Upsert authors / categories / topics ---
authorIDs, err := h.resolveTaxonomyIDs(ctx, tx, "book_authors", "authors", req.Authors)
if err != nil {
middleware.WriteError(w, 500, "INTERNAL_ERROR", err.Error())
return
}
categoryIDs, err := h.resolveTaxonomyIDs(ctx, tx, "book_categories", "categories", req.Categories)
if err != nil {
middleware.WriteError(w, 500, "INTERNAL_ERROR", err.Error())
return
}
topicIDs, err := h.resolveTaxonomyIDs(ctx, tx, "book_topics", "topics", req.Topics)
if err != nil {
middleware.WriteError(w, 500, "INTERNAL_ERROR", err.Error())
return
}

// --- Insert / update the book ---
now := time.Now()
sourceURL := strings.TrimSpace(req.SourceURL)
license := strings.TrimSpace(req.License)
coverURL := strings.TrimSpace(req.CoverURL)
pubDate := parseDate(req.PublicationDate)
description := strings.TrimSpace(req.Description)
if description == "" {
description = title
}

bookSlug := slug
var bookID string
if existing {
_, err = tx.Exec(ctx, `
UPDATE books SET title = $1, slug = $2, description = $3, level_id = $4,
                source_url = $5, license = NULLIF($6, ''),
                publication_date = $7, cover_url = NULLIF($8, ''),
                updated_at = $9
WHERE id = $10::uuid`,
title, bookSlug, description, levelID, sourceURL, license, pubDate, coverURL, now, bookIDValue)
if err != nil {
middleware.WriteError(w, 500, "INTERNAL_ERROR", "Something went wrong")
return
}
bookID = bookIDValue
} else {
err := tx.QueryRow(ctx, `
INSERT INTO books (title, slug, description, level_id, source_url, license, publication_date, cover_url, created_at, updated_at)
VALUES ($1, $2, $3, $4, $5, NULLIF($6, ''), $7, NULLIF($8, ''), $9, $9)
RETURNING id::text`, title, bookSlug, description, levelID, sourceURL, license, pubDate, coverURL, now).Scan(&bookID)
if err != nil {
if isUniqueViolation(err) {
middleware.WriteError(w, 409, "SLUG_CONFLICT", "A book with this slug already exists")
return
}
middleware.WriteError(w, 500, "INTERNAL_ERROR", "Something went wrong")
return
}
}

// --- Replace associations ---
h.replaceAssociations(ctx, tx, "book_authors", "author_id", bookID, authorIDs)
h.replaceAssociations(ctx, tx, "book_categories", "category_id", bookID, categoryIDs)
h.replaceAssociations(ctx, tx, "book_topics", "topic_id", bookID, topicIDs)

// --- Replace chapters (delete old + insert new) ---
tx.Exec(ctx, `DELETE FROM chapters WHERE book_id = $1::uuid`, bookID)
for i, ch := range chapterInputs {
chSlug := slugify(ch.Slug)
if chSlug == "" {
chSlug = slugify(ch.Title)
}
if chSlug == "" {
chSlug = slugify(title) + "-" + strconv.Itoa(i+1)
}
if !slugPattern.MatchString(chSlug) {
middleware.WriteError(w, 422, "VALIDATION_ERROR", "chapter slug may only contain lowercase letters, digits and hyphens")
return
}
chTitle := strings.TrimSpace(ch.Title)
if chTitle == "" {
chTitle = extractFirstHeading(ch.Content)
if chTitle == "" {
chTitle = strings.Title(strings.ReplaceAll(chSlug, "-", " "))
}
}
_, err = tx.Exec(ctx, `
INSERT INTO chapters (book_id, slug, title, chapter_order, content, created_at, updated_at)
VALUES ($1::uuid, $2, $3, $4, $5, $6, $6)`,
bookID, chSlug, chTitle, i+1, ch.Content, now)
if err != nil {
if isUniqueViolation(err) {
middleware.WriteError(w, 422, "VALIDATION_ERROR", "duplicate chapter slug or order")
return
}
middleware.WriteError(w, 500, "INTERNAL_ERROR", "Something went wrong")
return
}
}

if err := tx.Commit(ctx); err != nil {
middleware.WriteError(w, 500, "INTERNAL_ERROR", "Something went wrong")
return
}

writeData(w, http.StatusCreated, map[string]interface{}{
"id":            bookID,
"slug":          slug,
"title":         title,
"level":         levelSlug,
"chapter_count": len(chapterInputs),
})
}
