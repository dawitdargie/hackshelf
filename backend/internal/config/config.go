package config

import (
	"fmt"
	"os"
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

	return cfg, nil
}
