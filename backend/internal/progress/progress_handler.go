package progress

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

// Handler handles reading progress HTTP requests.
type Handler struct {
	repo        *Repository
	bookService *books.BookService
}

// NewHandler creates a new progress Handler.
func NewHandler(repo *Repository, bookService *books.BookService) *Handler {
	return &Handler{repo: repo, bookService: bookService}
}

func writeAppError(w http.ResponseWriter, appErr *middleware.AppError) {
	middleware.WriteError(w, appErr.Status, appErr.Code, appErr.Message)
}

// Get handles GET /api/v1/me/books/{bookId}/progress (auth required).
func (h *Handler) Get(w http.ResponseWriter, r *http.Request) {
	userID := auth.UserIDFromContext(r.Context())
	bookID := r.PathValue("bookId")
	if appErr := h.bookService.ValidateBookID(r.Context(), bookID); appErr != nil {
		writeAppError(w, appErr)
		return
	}
	e, err := h.repo.Get(r.Context(), userID, bookID)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			writeAppError(w, middleware.NewAppError(404, "PROGRESS_NOT_FOUND", "No reading progress for this book"))
			return
		}
		middleware.WriteError(w, 500, "INTERNAL_ERROR", "Something went wrong")
		return
	}
	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(map[string]interface{}{"data": e})
}

// Upsert handles PUT /api/v1/me/books/{bookId}/progress (auth required).
func (h *Handler) Upsert(w http.ResponseWriter, r *http.Request) {
	userID := auth.UserIDFromContext(r.Context())
	bookID := r.PathValue("bookId")
	if appErr := h.bookService.ValidateBookID(r.Context(), bookID); appErr != nil {
		writeAppError(w, appErr)
		return
	}

	var e Entry
	r.Body = http.MaxBytesReader(w, r.Body, maxBodyBytes)
	if err := json.NewDecoder(r.Body).Decode(&e); err != nil {
		writeAppError(w, middleware.NewAppError(422, "VALIDATION_ERROR", "invalid JSON body"))
		return
	}
	if appErr := e.Validate(); appErr != nil {
		writeAppError(w, appErr)
		return
	}
	if err := h.repo.Upsert(r.Context(), userID, bookID, &e); err != nil {
		middleware.WriteError(w, 500, "INTERNAL_ERROR", "Something went wrong")
		return
	}
	w.WriteHeader(http.StatusNoContent)
}

// Delete handles DELETE /api/v1/me/books/{bookId}/progress (auth required). Idempotent.
func (h *Handler) Delete(w http.ResponseWriter, r *http.Request) {
	userID := auth.UserIDFromContext(r.Context())
	bookID := r.PathValue("bookId")
	if appErr := h.bookService.ValidateBookID(r.Context(), bookID); appErr != nil {
		writeAppError(w, appErr)
		return
	}
	if err := h.repo.Delete(r.Context(), userID, bookID); err != nil {
		middleware.WriteError(w, 500, "INTERNAL_ERROR", "Something went wrong")
		return
	}
	w.WriteHeader(http.StatusNoContent)
}
