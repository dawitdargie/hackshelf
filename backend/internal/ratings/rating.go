// Package ratings implements rating creation/update/delete for books.
package ratings

import (
	"fmt"
	"net/http"

	"hackshelf/backend/internal/http/middleware"
)

// MinRating and MaxRating bound valid rating values.
const (
	MinRating = 1
	MaxRating = 5
)

// RatingRequest is the request body for PUT /books/{bookId}/rating (API spec §18).
type RatingRequest struct {
	Rating int `json:"rating"`
}

// Validate checks that the rating is an integer between 1 and 5.
func (req *RatingRequest) Validate() *middleware.AppError {
	if req.Rating < MinRating || req.Rating > MaxRating {
		return middleware.NewAppError(
			http.StatusUnprocessableEntity,
			"VALIDATION_ERROR",
			fmt.Sprintf("rating must be an integer between %d and %d", MinRating, MaxRating),
		)
	}
	return nil
}
