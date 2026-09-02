package reviews

import (
	"strings"
	"testing"
)

func TestReviewRequestValidate(t *testing.T) {
	tests := []struct {
		name    string
		content string
		wantErr bool
	}{
		{"valid short", "Great book.", false},
		{"valid max boundary", strings.Repeat("a", MaxContentLength), false},
		{"empty invalid", "", true},
		{"whitespace only invalid", "   \n\t  ", true},
		{"over max invalid", strings.Repeat("a", MaxContentLength+1), true},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			req := &ReviewRequest{Content: tt.content}
			err := req.Validate()
			if gotErr := err != nil; gotErr != tt.wantErr {
				t.Fatalf("Validate() error = %v, wantErr %v", err, tt.wantErr)
			}
			if tt.wantErr && err.Status != 422 {
				t.Errorf("expected 422, got %d", err.Status)
			}
		})
	}
}

func TestReviewRequestValidateTrims(t *testing.T) {
	req := &ReviewRequest{Content: "  padded review  "}
	if err := req.Validate(); err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if req.Content != "padded review" {
		t.Errorf("expected trimmed content, got %q", req.Content)
	}
}
