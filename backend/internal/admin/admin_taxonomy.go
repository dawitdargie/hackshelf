package admin

import (
"net/http"
"strings"

"hackshelf/backend/internal/http/middleware"
)

type taxonomySpec struct {
Table     string
NameMax   int
SlugMax   int
ItemLabel string
// HasLongText selects the table-specific upsert statement: categories take
// a description, authors a bio, topics none.
Variant string // "category" | "topic" | "author"
}

// CreateCategory handles POST /api/v1/admin/categories.
func (h *Handler) CreateCategory(w http.ResponseWriter, r *http.Request) {
h.createTaxonomy(w, r, taxonomySpec{Table: "categories", NameMax: 100, SlugMax: 100, ItemLabel: "category", Variant: "category"})
}

// CreateTopic handles POST /api/v1/admin/topics.
func (h *Handler) CreateTopic(w http.ResponseWriter, r *http.Request) {
h.createTaxonomy(w, r, taxonomySpec{Table: "topics", NameMax: 100, SlugMax: 100, ItemLabel: "topic", Variant: "topic"})
}

// CreateAuthor handles POST /api/v1/admin/authors.
func (h *Handler) CreateAuthor(w http.ResponseWriter, r *http.Request) {
h.createTaxonomy(w, r, taxonomySpec{Table: "authors", NameMax: 255, SlugMax: 255, ItemLabel: "author", Variant: "author"})
}

// createTaxonomy upserts a taxonomy row by slug. An existing slug returns the
// updated stored row (with 201 either way) so the admin form never blocks on
// duplicates; a name collision on a DIFFERENT slug is a 409.
func (h *Handler) createTaxonomy(w http.ResponseWriter, r *http.Request, spec taxonomySpec) {
var req struct {
Name        string `json:"name"`
Slug        string `json:"slug"`
Description string `json:"description"`
}
if err := decodeBody(w, r, &req); err != nil {
return
}
name := strings.TrimSpace(req.Name)
if name == "" {
middleware.WriteError(w, 422, "VALIDATION_ERROR", spec.ItemLabel+" name is required")
return
}
if len(name) > spec.NameMax {
middleware.WriteError(w, 422, "VALIDATION_ERROR", spec.ItemLabel+" name is too long")
return
}
slug := slugify(req.Slug)
if slug == "" {
slug = slugify(name)
}
if slug == "" {
middleware.WriteError(w, 422, "VALIDATION_ERROR", spec.ItemLabel+" name must contain letters or digits")
return
}
if len(slug) > spec.SlugMax {
middleware.WriteError(w, 422, "VALIDATION_ERROR", spec.ItemLabel+" slug is too long")
return
}
if !slugPattern.MatchString(slug) {
middleware.WriteError(w, 422, "VALIDATION_ERROR", "slug may only contain lowercase letters, digits and hyphens")
return
}

var id string
var q string
var args []interface{}
switch spec.Variant {
case "category":
q = `INSERT INTO categories (name, slug, description)
 VALUES ($1, $2, NULLIF($3, ''))
 ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, description = EXCLUDED.description
 RETURNING id`
args = []interface{}{name, slug, strings.TrimSpace(req.Description)}
case "author":
q = `INSERT INTO authors (name, slug, bio)
 VALUES ($1, $2, NULLIF($3, ''))
 ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, bio = EXCLUDED.bio
 RETURNING id`
args = []interface{}{name, slug, strings.TrimSpace(req.Description)}
default:
q = `INSERT INTO topics (name, slug)
 VALUES ($1, $2)
 ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name
 RETURNING id`
args = []interface{}{name, slug}
}
err := h.pool.QueryRow(r.Context(), q, args...).Scan(&id)
if err != nil {
if isUniqueViolation(err) {
// The NAME is taken by a different slug — a genuine conflict.
middleware.WriteError(w, 409, "CONFLICT", "A "+spec.ItemLabel+" with this name already exists")
return
}
middleware.WriteError(w, 500, "INTERNAL_ERROR", "Something went wrong")
return
}

resp := map[string]interface{}{"id": id, "name": name, "slug": slug}
if spec.Variant != "topic" {
resp["description"] = strings.TrimSpace(req.Description)
}
writeData(w, http.StatusCreated, resp)
}
