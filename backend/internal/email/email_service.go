package email

import (
	"context"
	"fmt"
	"log"
	"net/url"
	"strings"
)

// defaultFrontendURL is used when FRONTEND_URL is not configured, so reset
// links are still well-formed in local development.
const defaultFrontendURL = "http://localhost:3000"

// EmailSender is a pluggable interface for sending emails.
// A production implementation (e.g., SMTP or an API provider) can be
// swapped in without changing calling code.
type EmailSender interface {
	SendPasswordReset(ctx context.Context, to, resetToken string) error
}

// DevEmailSender is a development implementation that logs emails
// to stdout instead of actually sending them. The log line includes the full
// frontend reset link so the password-reset flow is usable end-to-end locally.
type DevEmailSender struct {
	frontendURL string
}

// NewDevEmailSender creates a new DevEmailSender. frontendURL is the public
// origin of the web app (config.FrontendURL) used to build reset links.
func NewDevEmailSender(frontendURL string) *DevEmailSender {
	frontendURL = strings.TrimRight(strings.TrimSpace(frontendURL), "/")
	if frontendURL == "" {
		frontendURL = defaultFrontendURL
	}
	return &DevEmailSender{frontendURL: frontendURL}
}

// ResetURL builds the frontend link that carries the reset token.
func (s *DevEmailSender) ResetURL(resetToken string) string {
	return fmt.Sprintf("%s/reset-password?token=%s", s.frontendURL, url.QueryEscape(resetToken))
}

// SendPasswordReset logs the password reset link (and the raw token) to stdout.
func (s *DevEmailSender) SendPasswordReset(ctx context.Context, to, resetToken string) error {
	log.Printf("[DEV EMAIL] To: %s | Subject: Reset your HackShelf password | Reset link: %s | Reset token: %s",
		to, s.ResetURL(resetToken), resetToken)
	return nil
}

// Compile-time interface check.
var _ EmailSender = (*DevEmailSender)(nil)

// String returns a descriptive name for the sender (useful for logs).
func (s *DevEmailSender) String() string {
	return fmt.Sprintf("DevEmailSender(%s)", s.frontendURL)
}
