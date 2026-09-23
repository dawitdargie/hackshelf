package email

import (
	"context"
	"strings"
	"testing"
)

func TestResetURLIncludesToken(t *testing.T) {
	sender := NewDevEmailSender("http://localhost:3000")
	got := sender.ResetURL("abc.def.ghi")
	want := "http://localhost:3000/reset-password?token=abc.def.ghi"
	if got != want {
		t.Fatalf("expected %q, got %q", want, got)
	}
}

func TestResetURLTrimsTrailingSlash(t *testing.T) {
	sender := NewDevEmailSender("https://hackshelf.example/")
	if got := sender.ResetURL("tok"); got != "https://hackshelf.example/reset-password?token=tok" {
		t.Fatalf("unexpected reset URL: %q", got)
	}
}

func TestResetURLFallsBackToLocalhost(t *testing.T) {
	sender := NewDevEmailSender("")
	if got := sender.ResetURL("tok"); !strings.HasPrefix(got, defaultFrontendURL+"/reset-password") {
		t.Fatalf("expected localhost fallback, got %q", got)
	}
}

func TestResetURLEscapesToken(t *testing.T) {
	sender := NewDevEmailSender("http://localhost:3000")
	if got := sender.ResetURL("a+b/c"); strings.Contains(got, "a+b/c") {
		t.Fatalf("token was not URL-escaped: %q", got)
	}
}

func TestSendPasswordResetSucceeds(t *testing.T) {
	sender := NewDevEmailSender("http://localhost:3000")
	if err := sender.SendPasswordReset(context.Background(), "user@example.com", "tok"); err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
}
