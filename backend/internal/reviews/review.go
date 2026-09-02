// Package reviews implements book reviews with ownership-verified updates.
package reviews

import (
	"fmt"
	"net/http"
	"strings"
	"unicode/utf8"

	"hackshelf/backend/internal/http/middleware"
)

// MaxContentLength bounds review content size.
const MaxContentLength = 5000

// ReviewRequest is the request body for create/update review (API spec §17).
type ReviewRequest struct {
	Content string `json:"content"`
}

// Validate checks the content is non-empty and within the length limit.
func (req *ReviewRequest) Validate() *middleware.AppError {
	content := strings.TrimSpace(req.Content)
	if content == "" {
		return middleware.NewAppError(
			http.StatusUnprocessableEntity, "VALIDATION_ERROR", "content must not be empty")
	}
	if utf8.RuneCountInString(content) > MaxContentLength {
		return middleware.NewAppError(
			http.StatusUnprocessableEntity,
			"VALIDATION_ERROR",
			fmt.Sprintf("content must be at most %d characters", MaxContentLength),
		)
	}
	req.Content = content
	return nil
}
