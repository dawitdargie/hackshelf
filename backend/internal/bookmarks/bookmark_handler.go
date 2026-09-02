package bookmarks

import (
	"encoding/json"
	"errors"
	"net/http"

	"github.com/jackc/pgx/v5"

	"hackshelf/backend/internal/auth"
	"hackshelf/backend/internal/books"
	"hackshelf/backend/internal/http/middleware"
)

// maxBodyBytes limits request body size.
const maxBodyBytes = 1 << 12 // 4 KB

// Handler handles bookmark HTTP requests.
type Handler struct {
	repo        *Repository
	bookService *books.BookService
}

// NewHandler creates a new bookmarks Handler.
func NewHandler(repo *Repository, bookService *books.BookService) *Handler {
	return &Handler{repo: repo, bookService: bookService}
}

func writeAppError(w http.ResponseWriter, appErr *middleware.AppError) {
	middleware.WriteError(w, appErr.Status, appErr.Code, appErr.Message)
}

func writeJSON(w http.ResponseWriter, status int, payload interface{}) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(payload)
}

// ListAll handles GET /api/v1/me/bookmarks (auth required).
func (h *Handler) ListAll(w http.ResponseWriter, r *http.Request) {
	userID := auth.UserIDFromContext(r.Context())
	list, err := h.repo.ListByUser(r.Context(), userID)
	if err != nil {
		middleware.WriteError(w, 500, "INTERNAL_ERROR", "Something went wrong")
		return
	}
	if list == nil {
		list = []Bookmark{}
	}
	writeJSON(w, http.StatusOK, map[string]interface{}{"data": list})
}

// ListForBook handles GET /api/v1/me/books/{bookId}/bookmarks (auth required).
func (h *Handler) ListForBook(w http.ResponseWriter, r *http.Request) {
	userID := auth.UserIDFromContext(r.Context())
	bookID := r.PathValue("bookId")
	if appErr := h.bookService.ValidateBookID(r.Context(), bookID); appErr != nil {
		writeAppError(w, appErr)
		return
	}
	list, err := h.repo.ListByBook(r.Context(), userID, bookID)
	if err != nil {
		middleware.WriteError(w, 500, "INTERNAL_ERROR", "Something went wrong")
		return
	}
	if list == nil {
		list = []Bookmark{}
	}
	writeJSON(w, http.StatusOK, map[string]interface{}{"data": list})
}

// Create handles POST /api/v1/me/books/{bookId}/bookmarks (auth required).
func (h *Handler) Create(w http.ResponseWriter, r *http.Request) {
	userID := auth.UserIDFromContext(r.Context())
	bookID := r.PathValue("bookId")
	if appErr := h.bookService.ValidateBookID(r.Context(), bookID); appErr != nil {
		writeAppError(w, appErr)
		return
	}

	var req CreateRequest
	r.Body = http.MaxBytesReader(w, r.Body, maxBodyBytes)
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeAppError(w, middleware.NewAppError(422, "VALIDATION_ERROR", "invalid JSON body"))
		return
	}
	if appErr := req.Validate(); appErr != nil {
		writeAppError(w, appErr)
		return
	}

	b, err := h.repo.Create(r.Context(), userID, bookID, &req)
	if err != nil {
		middleware.WriteError(w, 500, "INTERNAL_ERROR", "Something went wrong")
		return
	}
	writeJSON(w, http.StatusCreated, map[string]interface{}{"data": b})
}

// Delete handles DELETE /api/v1/me/bookmarks/{bookmarkId} (auth required).
// Not-owned or missing bookmarks are indistinguishable (404).
func (h *Handler) Delete(w http.ResponseWriter, r *http.Request) {
	userID := auth.UserIDFromContext(r.Context())
	bookmarkID := r.PathValue("bookmarkId")

	if err := h.repo.Delete(r.Context(), userID, bookmarkID); err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			writeAppError(w, middleware.NewAppError(404, "BOOKMARK_NOT_FOUND", "Bookmark not found"))
			return
		}
		middleware.WriteError(w, 500, "INTERNAL_ERROR", "Something went wrong")
		return
	}
	w.WriteHeader(http.StatusNoContent)
}
