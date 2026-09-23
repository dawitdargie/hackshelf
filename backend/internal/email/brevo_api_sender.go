package email

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"net/url"
	"strings"
	"time"
)

// brevoAPIEndpoint is Brevo's transactional email REST endpoint. It is called
// over HTTPS (port 443), which works from hosting environments that block
// outbound SMTP ports.
const brevoAPIEndpoint = "https://api.brevo.com/v3/smtp/email"

// BrevoAPISender sends password-reset emails through Brevo's HTTPS API.
type BrevoAPISender struct {
	apiKey      string
	from        string
	fromName    string
	frontendURL string
}

// NewBrevoAPISender creates a new BrevoAPISender. from is the verified sender
// address configured in Brevo; fromName is the display name shown in inboxes.
func NewBrevoAPISender(apiKey, from, fromName, frontendURL string) *BrevoAPISender {
	return &BrevoAPISender{
		apiKey:      strings.TrimSpace(apiKey),
		from:        strings.TrimSpace(from),
		fromName:    strings.TrimSpace(fromName),
		frontendURL: frontendURL,
	}
}

// ResetURL builds the frontend link that carries the reset token.
func (s *BrevoAPISender) ResetURL(resetToken string) string {
	base := strings.TrimRight(strings.TrimSpace(s.frontendURL), "/")
	if base == "" {
		base = defaultFrontendURL
	}
	return fmt.Sprintf("%s/reset-password?token=%s", base, url.QueryEscape(strings.TrimSpace(resetToken)))
}

// brevoEmailPayload mirrors the request body of POST /v3/smtp/email.
type brevoEmailPayload struct {
	Sender      brevoAddress   `json:"sender"`
	To          []brevoAddress `json:"to"`
	Subject     string         `json:"subject"`
	TextContent string         `json:"textContent"`
	HTMLContent string         `json:"htmlContent"`
	ReplyTo     brevoAddress   `json:"replyTo"`
}

type brevoAddress struct {
	Name  string `json:"name,omitempty"`
	Email string `json:"email"`
}

// SendPasswordReset sends the password-reset email via Brevo's API.
func (s *BrevoAPISender) SendPasswordReset(ctx context.Context, to, resetToken string) error {
	resetURL := s.ResetURL(resetToken)

	text := fmt.Sprintf(
		"Hello,\n\nYou requested a password reset for your HackShelf account.\n\nClick the link below to set a new password:\n\n  %s\n\nIf you did not request this, you can ignore this email.\n\nThis link expires in 1 hour.\n\nThanks,\nThe HackShelf team",
		resetURL,
	)
	html := fmt.Sprintf(
		"<html><body><p>Hello,</p><p>You requested a password reset for your HackShelf account.</p><p>Click the link below to set a new password:</p><p><a href=\"%s\">%s</a></p><p>If you did not request this, you can ignore this email.</p><p>This link expires in 1 hour.</p><p>Thanks,<br>The HackShelf team</p></body></html>",
		resetURL, resetURL,
	)

	payload := brevoEmailPayload{
		Sender:      brevoAddress{Name: s.fromName, Email: s.from},
		To:          []brevoAddress{{Email: to}},
		Subject:     "Reset your HackShelf password",
		TextContent: text,
		HTMLContent: html,
		ReplyTo:     brevoAddress{Email: s.from},
	}

	body, err := json.Marshal(payload)
	if err != nil {
		return fmt.Errorf("failed to encode brevo request: %w", err)
	}

	req, err := http.NewRequestWithContext(ctx, http.MethodPost, brevoAPIEndpoint, bytes.NewReader(body))
	if err != nil {
		return fmt.Errorf("failed to create brevo request: %w", err)
	}
	req.Header.Set("accept", "application/json")
	req.Header.Set("api-key", s.apiKey)
	req.Header.Set("content-type", "application/json")

	client := &http.Client{Timeout: 15 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		return fmt.Errorf("failed to call brevo api: %w", err)
	}
	defer resp.Body.Close()

	respBody, _ := io.ReadAll(io.LimitReader(resp.Body, 4096))
	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		return fmt.Errorf("brevo api returned %d: %s", resp.StatusCode, strings.TrimSpace(string(respBody)))
	}

	log.Printf("[brevo-api] sent to=%s subject=Reset your HackShelf password", to)
	return nil
}

// Compile-time interface check.
var _ EmailSender = (*BrevoAPISender)(nil)
