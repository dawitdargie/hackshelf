package auth

import (
	"context"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/golang-jwt/jwt/v5"
)

func TestResetTokenRoundTrip(t *testing.T) {
	secret := "test_secret"
	userID := "11111111-2222-3333-4444-555555555555"

	token, err := generateResetToken(userID, secret)
	if err != nil {
		t.Fatalf("generateResetToken failed: %v", err)
	}

	got, err := validateResetToken(token, secret)
	if err != nil {
		t.Fatalf("validateResetToken failed: %v", err)
	}
	if got != userID {
		t.Fatalf("expected userID %s, got %s", userID, got)
	}
}

func TestResetTokenWrongSecret(t *testing.T) {
	token, _ := generateResetToken("user-1", "secret_a")
	if _, err := validateResetToken(token, "secret_b"); err == nil {
		t.Fatal("expected validation to fail with wrong secret")
	}
}

func TestResetTokenExpired(t *testing.T) {
	// Build an already-expired reset token manually.
	claims := jwt.MapClaims{
		"sub":     "user-1",
		"purpose": resetTokenPurpose,
		"iat":     time.Now().Add(-2 * time.Hour).Unix(),
		"exp":     time.Now().Add(-1 * time.Hour).Unix(),
	}
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	signed, err := token.SignedString([]byte("test_secret"))
	if err != nil {
		t.Fatalf("signing failed: %v", err)
	}
	if _, err := validateResetToken(signed, "test_secret"); err == nil {
		t.Fatal("expected expired token to be rejected")
	}
}

func TestResetTokenWrongPurpose(t *testing.T) {
	// An access token (no purpose claim) must not work as a reset token.
	accessToken, err := GenerateAccessToken("user-1", "test_secret", 15*time.Minute)
	if err != nil {
		t.Fatalf("GenerateAccessToken failed: %v", err)
	}
	if _, err := validateResetToken(accessToken, "test_secret"); err == nil {
		t.Fatal("expected access token to be rejected as reset token")
	}
}

func TestAuthMiddleware(t *testing.T) {
	secret := "test_secret"
	mw := AuthMiddleware(secret)

	next := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if got := UserIDFromContext(r.Context()); got != "user-1" {
			t.Errorf("expected user-1 in context, got %q", got)
		}
		w.WriteHeader(http.StatusOK)
	})

	// Valid token → 200 and user ID in context.
	token, _ := GenerateAccessToken("user-1", secret, 15*time.Minute)
	req := httptest.NewRequest("GET", "/api/v1/me", nil)
	req.Header.Set("Authorization", "Bearer "+token)
	rec := httptest.NewRecorder()
	mw(next).ServeHTTP(rec, req)
	if rec.Code != http.StatusOK {
		t.Fatalf("valid token: expected 200, got %d", rec.Code)
	}

	// Missing header → 401.
	rec = httptest.NewRecorder()
	mw(next).ServeHTTP(rec, httptest.NewRequest("GET", "/api/v1/me", nil))
	if rec.Code != http.StatusUnauthorized {
		t.Fatalf("missing header: expected 401, got %d", rec.Code)
	}

	// Invalid token → 401.
	req = httptest.NewRequest("GET", "/api/v1/me", nil)
	req.Header.Set("Authorization", "Bearer bogus.token.value")
	rec = httptest.NewRecorder()
	mw(next).ServeHTTP(rec, req)
	if rec.Code != http.StatusUnauthorized {
		t.Fatalf("invalid token: expected 401, got %d", rec.Code)
	}

	// Context helper on empty context → empty string.
	if got := UserIDFromContext(context.Background()); got != "" {
		t.Fatalf("expected empty userID, got %q", got)
	}
}
