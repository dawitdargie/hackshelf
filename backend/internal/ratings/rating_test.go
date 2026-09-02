package ratings

import (
	"testing"

	"hackshelf/backend/internal/http/middleware"
)

func TestRatingRequestValidate(t *testing.T) {
	tests := []struct {
		name    string
		rating  int
		wantErr bool
	}{
		{"min valid", 1, false},
		{"middle valid", 3, false},
		{"max valid", 5, false},
		{"zero invalid", 0, true},
		{"negative invalid", -2, true},
		{"above max invalid", 6, true},
		{"far above invalid", 100, true},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			req := &RatingRequest{Rating: tt.rating}
			err := req.Validate()
			if gotErr := err != nil; gotErr != tt.wantErr {
				t.Fatalf("Validate() error = %v, wantErr %v", err, tt.wantErr)
			}
			if tt.wantErr && err.Status != 422 {
				t.Errorf("expected 422, got %d", err.Status)
			}
			if tt.wantErr && err.Code != "VALIDATION_ERROR" {
				t.Errorf("expected VALIDATION_ERROR, got %s", err.Code)
			}
		})
	}
}

// Compile-time check that AppError is the returned type.
var _ *middleware.AppError
