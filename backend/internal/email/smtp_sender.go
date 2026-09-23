package email

import (
	"log"
"context"
"crypto/tls"
"fmt"
"net"
"net/smtp"
"strings"
"math/rand"
"time"
)

// SMTPSender sends password-reset emails via an SMTP server.
type SMTPSender struct {
host        string
port        int
user        string
pass        string
from        string
localName   string
frontendURL string
}

// NewSMTPSender creates a new SMTPSender.
func NewSMTPSender(host string, port int, user, pass, from, localName, frontendURL string) *SMTPSender {
return &SMTPSender{
host:        host,
port:        port,
user:        user,
pass:        pass,
from:        from,
localName:   localName,
frontendURL: frontendURL,
}
}

// ResetURL builds the frontend link that carries the reset token (mirrors DevEmailSender).
func (s *SMTPSender) ResetURL(resetToken string) string {
base := strings.TrimRight(s.frontendURL, "/")
if base == "" {
base = defaultFrontendURL
}
return fmt.Sprintf("%s/reset-password?token=%s", base, strings.TrimSpace(resetToken))
}

// boundary returns a MIME multipart boundary string.
func boundary() string {
return "hackshelf-email-boundary-1234567890"
}

// randHex returns a short random hex string for Message-ID generation.
func randHex() string {
return fmt.Sprintf("%x", rand.Intn(1<<24))
}

// SendPasswordReset sends a password-reset email to the given address.
func (s *SMTPSender) SendPasswordReset(ctx context.Context, to, resetToken string) error {
resetURL := s.ResetURL(resetToken)
	fromHeader, _ := s.envelopeFrom()

// Build a plain-text message (with a minimal HTML alternative for clients that support it).
body := fmt.Sprintf(
"Hello,\n\nYou requested a password reset for your HackShelf account.\n\nClick the link below to set a new password:\n\n  %s\n\nIf you did not request this, you can ignore this email.\n\nThis link expires in 1 hour.\n\nThanks,\nThe HackShelf team",
resetURL,
)
textPart := "text/plain; charset=UTF-8"
htmlPart := "text/html; charset=UTF-8"

msg := strings.Builder{}
msg.WriteString(fmt.Sprintf("From: %s\r\n", fromHeader))
msg.WriteString(fmt.Sprintf("To: %s\r\n", to))
msg.WriteString(fmt.Sprintf("Date: %s\r\n", time.Now().UTC().Format(time.RFC1123Z)))
msg.WriteString(fmt.Sprintf("Message-ID: <%s.%s.%s@hackshelf.local>\r\n",
    to, time.Now().UTC().Format("20060102150405"), randHex()))
msg.WriteString("Subject: Reset your HackShelf password\r\n")
msg.WriteString("Reply-To: " + strings.TrimSpace(s.from) + "\r\n")
msg.WriteString("MIME-Version: 1.0\r\n")
msg.WriteString(fmt.Sprintf("Content-Type: multipart/alternative; boundary=\"%s\"\r\n", boundary()))
msg.WriteString("\r\n")

// Text part.
msg.WriteString(fmt.Sprintf("--%s\r\n", boundary()))
msg.WriteString(fmt.Sprintf("Content-Type: %s\r\n", textPart))
msg.WriteString("\r\n")
msg.WriteString(body)
msg.WriteString("\r\n")

// HTML part.
html := fmt.Sprintf(
"<html><body><p>Hello,</p><p>You requested a password reset for your HackShelf account.</p><p>Click the link below to set a new password:</p><p><a href=\"%s\">%s</a></p><p>If you did not request this, you can ignore this email.</p><p>This link expires in 1 hour.</p><p>Thanks,<br>The HackShelf team</p></body></html>",
resetURL, resetURL,
)
msg.WriteString(fmt.Sprintf("--%s\r\n", boundary()))
msg.WriteString(fmt.Sprintf("Content-Type: %s\r\n", htmlPart))
msg.WriteString("\r\n")
msg.WriteString(html)
msg.WriteString("\r\n")

msg.WriteString(fmt.Sprintf("--%s--\r\n", boundary()))

// Honor context by bounding the send on a timeout. Use a short internal
// timeout per dial/write so a hung SMTP server cannot block the handler
// indefinitely.
timeout := 15 * time.Second
done := make(chan error, 1)
go func() {
done <- s.send(ctx, to, msg.String())
}()

select {
case err := <-done:
if err != nil {
log.Printf("[smtp] send failed to=%s host=%s:%d err=%v", to, s.host, s.port, err)
} else {
log.Printf("[smtp] sent to=%s subject=Reset your HackShelf password", to)
}
return err
case <-ctx.Done():
return fmt.Errorf("sending email timed out: %w", ctx.Err())
case <-time.After(timeout):
return fmt.Errorf("sending email timed out after %s", timeout)
}
}

// envelopeFrom returns the From header value (which may carry a display name)
// and the bare address used for the SMTP MAIL FROM command.
func (s *SMTPSender) envelopeFrom() (header, addr string) {
	f := strings.TrimSpace(s.from)
	header = f
	if i := strings.LastIndex(f, "<"); i >= 0 && strings.HasSuffix(f, ">") {
		addr = strings.TrimSpace(strings.TrimSuffix(f[i+1:], ">"))
		return header, addr
	}
	return header, f
}
func (s *SMTPSender) send(ctx context.Context, to, msg string) error {
address := fmt.Sprintf("%s:%d", s.host, s.port)
	_, fromAddr := s.envelopeFrom()

var auth smtp.Auth
if s.user != "" && s.pass != "" {
auth = smtp.PlainAuth(s.localName, s.user, s.pass, s.host)
}

if s.port == 465 {
// Implicit TLS.
tlsConfig := &tls.Config{
ServerName: s.host,
MinVersion: tls.VersionTLS12,
}
dialer := &net.Dialer{Timeout: 10 * time.Second}
conn, err := tls.DialWithDialer(dialer, "tcp", address, tlsConfig)
if err != nil {
return fmt.Errorf("failed to connect to %s: %w", address, err)
}
defer conn.Close()

client, err := smtp.NewClient(conn, s.host)
if err != nil {
return fmt.Errorf("failed to create SMTP client: %w", err)
}
defer client.Close()

if auth != nil {
if err := client.Auth(auth); err != nil {
return fmt.Errorf("SMTP auth failed: %w", err)
}
}
if err := client.Mail(fromAddr); err != nil {
return fmt.Errorf("failed to set sender: %w", err)
}
if err := client.Rcpt(to); err != nil {
return fmt.Errorf("failed to set recipient: %w", err)
}
wc, err := client.Data()
if err != nil {
return fmt.Errorf("failed to open data: %w", err)
}
if _, err := wc.Write([]byte(msg)); err != nil {
return fmt.Errorf("failed to write message: %w", err)
}
if err := wc.Close(); err != nil {
return fmt.Errorf("failed to close data: %w", err)
}
return client.Quit()
}

// Explicit TLS (STARTTLS) on port 587, or plain on others.
dialer := &net.Dialer{Timeout: 10 * time.Second}
conn, err := dialer.DialContext(ctx, "tcp", address)
if err != nil {
return fmt.Errorf("failed to connect to %s: %w", address, err)
}
defer conn.Close()

client, err := smtp.NewClient(conn, s.host)
if err != nil {
return fmt.Errorf("failed to create SMTP client: %w", err)
}
defer client.Close()

// If the config asked for TLS and the server supports STARTTLS, upgrade.
if s.port == 587 {
startTLSConfig := &tls.Config{ServerName: s.host, MinVersion: tls.VersionTLS12}
		if err := client.StartTLS(startTLSConfig); err != nil {
// Some servers advertise STARTTLS but fail; fall back to plain if auth
// is not required, otherwise surface the error.
if auth != nil {
return fmt.Errorf("STARTTLS failed and auth is required: %w", err)
}
}
}

if auth != nil {
if err := client.Auth(auth); err != nil {
return fmt.Errorf("SMTP auth failed: %w", err)
}
}
if err := client.Mail(fromAddr); err != nil {
return fmt.Errorf("failed to set sender: %w", err)
}
if err := client.Rcpt(to); err != nil {
return fmt.Errorf("failed to set recipient: %w", err)
}
wc, err := client.Data()
if err != nil {
return fmt.Errorf("failed to open data: %w", err)
}
if _, err := wc.Write([]byte(msg)); err != nil {
return fmt.Errorf("failed to write message: %w", err)
}
if err := wc.Close(); err != nil {
return fmt.Errorf("failed to close data: %w", err)
}
return client.Quit()
}

// Compile-time check that SMTPSender implements EmailSender.
var _ EmailSender = (*SMTPSender)(nil)

// String returns a descriptive name useful for logs.
func (s *SMTPSender) String() string {
return fmt.Sprintf("SMTPSender(%s:%d)", s.host, s.port)
}
