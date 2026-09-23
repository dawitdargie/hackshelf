package config

import (
	"fmt"
	"log"
	"os"
	"strconv"
	"time"
)

// Config holds all application configuration loaded from environment variables.
type Config struct {
	DatabaseURL        string
	JWTAccessSecret    string
	JWTRefreshSecret   string
	AccessTokenExpiry  string
	RefreshTokenExpiry string
	FrontendURL        string
	Port               string

	// Rate limiting configuration.
	RateLimitAuth    int           // Max auth requests (login/signup/etc.) per window per IP
	RateLimitGeneral int           // Max general requests per window per IP
	RateLimitWindow  time.Duration // Rate limit window
	TrustProxy       bool          // Trust X-Forwarded-For header (only when behind a known proxy)

	// Email delivery configuration.
	EmailMode   string // "dev" (log to stdout), "smtp" (send via SMTP), or "api" (Brevo HTTPS API)
	BrevoAPIKey string // Brevo API key for EMAIL_MODE=api
	BrevoFromName string // Display name for emails sent via EMAIL_MODE=api
	SMTPHost    string
	SMTPPort    int
	SMTPUser    string
	SMTPPass    string
	SMTPUseTLS  bool
	SMTPLocalName string
	SMTPFrom    string
}

// Load reads configuration from environment variables.
// It returns an error if any required variable is missing.
func Load() (*Config, error) {
	cfg := &Config{
		DatabaseURL:        os.Getenv("DATABASE_URL"),
		JWTAccessSecret:    os.Getenv("JWT_ACCESS_SECRET"),
		JWTRefreshSecret:   os.Getenv("JWT_REFRESH_SECRET"),
		AccessTokenExpiry:  os.Getenv("ACCESS_TOKEN_EXPIRES"),
		RefreshTokenExpiry: os.Getenv("REFRESH_TOKEN_EXPIRES"),
		FrontendURL:        os.Getenv("FRONTEND_URL"),
		Port:               os.Getenv("PORT"),
		EmailMode:          os.Getenv("EMAIL_MODE"),
		BrevoAPIKey:        os.Getenv("BREVO_API_KEY"),
		BrevoFromName:      os.Getenv("BREVO_FROM_NAME"),
		SMTPHost:           os.Getenv("SMTP_HOST"),
		SMTPUser:           os.Getenv("SMTP_USER"),
		SMTPPass:           os.Getenv("SMTP_PASS"),
		SMTPLocalName:      os.Getenv("SMTP_LOCAL_NAME"),
		SMTPFrom:           os.Getenv("SMTP_FROM"),
	}

	if cfg.DatabaseURL == "" {
		return nil, fmt.Errorf("DATABASE_URL environment variable is required")
	}
	if cfg.JWTAccessSecret == "" {
		return nil, fmt.Errorf("JWT_ACCESS_SECRET environment variable is required")
	}
	if cfg.JWTRefreshSecret == "" {
		return nil, fmt.Errorf("JWT_REFRESH_SECRET environment variable is required")
	}
	if cfg.FrontendURL == "" {
		return nil, fmt.Errorf("FRONTEND_URL environment variable is required")
	}
	if cfg.Port == "" {
		cfg.Port = "8080"
	}
	if cfg.AccessTokenExpiry == "" {
		cfg.AccessTokenExpiry = "15m"
	}
	if cfg.RefreshTokenExpiry == "" {
		cfg.RefreshTokenExpiry = "7d"
	}

	// Rate limiting: generous defaults so a normal user (failed attempts
	// included) never locks themselves out during a single minute.
	cfg.RateLimitAuth = envInt("RATE_LIMIT_AUTH", 20)
	cfg.RateLimitGeneral = envInt("RATE_LIMIT_GENERAL", 120)
	if w, err := time.ParseDuration(os.Getenv("RATE_LIMIT_WINDOW")); err == nil && w > 0 {
		cfg.RateLimitWindow = w
	} else {
		cfg.RateLimitWindow = time.Minute
	}
	switch os.Getenv("TRUST_PROXY") {
	case "1", "true":
		cfg.TrustProxy = true
	}

	// Parse SMTP port; 587 is the standard submission port (STARTTLS).
	if cfg.EmailMode == "smtp" {
		if cfg.SMTPPort == 0 {
			if p, err := strconv.Atoi(os.Getenv("SMTP_PORT")); err == nil {
				cfg.SMTPPort = p
			}
		}
		if cfg.SMTPPort == 0 {
			cfg.SMTPPort = 587
		}
		if cfg.SMTPUseTLS {
			// nothing to parse, already bool zero value = false unless set
		}
		// SMTPUseTLS is set from env below if present.
		if v := os.Getenv("SMTP_USE_TLS"); v == "1" || v == "true" {
			cfg.SMTPUseTLS = true
		}
		if cfg.SMTPHost == "" || cfg.SMTPUser == "" || cfg.SMTPPass == "" {
			log.Printf("[config] WARNING: EMAIL_MODE=smtp but SMTP_HOST/SMTP_USER/SMTP_PASS incomplete - email will NOT be sent")
		}
		// Default from address when not configured.
		if cfg.SMTPFrom == "" {
			cfg.SMTPFrom = "noreply@hackshelf.example"
		}
		// Local name defaults to the host name of the machine; fall back to a safe default.
		if cfg.SMTPLocalName == "" {
			cfg.SMTPLocalName = "hackshelf"
		}
	}

	return cfg, nil
}

// envInt reads an integer env var with a fallback default.
func envInt(key string, fallback int) int {
	if v, err := strconv.Atoi(os.Getenv(key)); err == nil && v > 0 {
		return v
	}
	return fallback
}
