package main

import (
	"log"

	"hackshelf/backend/internal/config"
	"hackshelf/backend/internal/database"
	apphttp "hackshelf/backend/internal/http"
)

func main() {
	// Load configuration
	cfg, err := config.Load()
	if err != nil {
		log.Fatalf("Failed to load configuration: %v", err)
	}

	// Connect to database
	db, err := database.Connect(cfg.DatabaseURL)
	if err != nil {
		log.Fatalf("Failed to connect to database: %v", err)
	}
	defer db.Close()

	// Create router
	router := apphttp.NewRouter(db, cfg)

	// Create and start server
	server := apphttp.NewServer(router, cfg.Port)
	if err := server.Start(); err != nil {
		log.Fatalf("Server failed: %v", err)
	}
}
