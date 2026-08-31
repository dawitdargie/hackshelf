package http

import (
	"encoding/json"
	"log"
	"net/http"
	"time"
)

// Server wraps the HTTP server.
type Server struct {
	httpServer *http.Server
}

// NewServer creates a new HTTP server with the given handler and port.
func NewServer(handler http.Handler, port string) *Server {
	return &Server{
		httpServer: &http.Server{
			Addr:         ":" + port,
			Handler:      handler,
			ReadTimeout:  15 * time.Second,
			WriteTimeout: 15 * time.Second,
			IdleTimeout:  60 * time.Second,
		},
	}
}

// Start begins listening for HTTP requests.
func (s *Server) Start() error {
	log.Printf("Server listening on %s", s.httpServer.Addr)
	return s.httpServer.ListenAndServe()
}

// writeJSON writes a JSON response with the given status code.
func writeJSON(w http.ResponseWriter, status int, data interface{}) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	if err := json.NewEncoder(w).Encode(data); err != nil {
		log.Printf("Failed to encode JSON response: %v", err)
	}
}
