package email

import (
	"context"
	"fmt"
	"log"
)

// EmailSender is a pluggable interface for sending emails.
// A production implementation (e.g., SMTP or an API provider) can be
// swapped in without changing calling code.
type EmailSender interface {
	SendPasswordReset(ctx context.Context, to, resetToken string) error
}

// DevEmailSender is a development implementation that logs emails
// to stdout instead of actually sending them.
type DevEmailSender struct{}

// NewDevEmailSender creates a new DevEmailSender.
func NewDevEmailSender() *DevEmailSender {
	return &DevEmailSender{}
}

// SendPasswordReset logs the password reset instructions to stdout.
func (s *DevEmailSender) SendPasswordReset(ctx context.Context, to, resetToken string) error {
	log.Printf("[DEV EMAIL] To: %s | Subject: Reset your HackShelf password | Reset token: %s", to, resetToken)
	return nil
}

// Compile-time interface check.
var _ EmailSender = (*DevEmailSender)(nil)

// String returns a descriptive name for the sender (useful for logs).
func (s *DevEmailSender) String() string {
	return fmt.Sprintf("DevEmailSender")
}
