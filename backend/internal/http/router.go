package http

import (
	"net/http"
	"time"

	"hackshelf/backend/internal/auth"
	"hackshelf/backend/internal/books"
	"hackshelf/backend/internal/config"
	"hackshelf/backend/internal/database"
	"hackshelf/backend/internal/email"
	"hackshelf/backend/internal/http/middleware"
	"hackshelf/backend/internal/users"
)

// Router holds the application's HTTP routes and dependencies.
type Router struct {
	mux            *http.ServeMux
	db             *database.DB
	cfg            *config.Config
	authHandler    *auth.AuthHandler
	tokenHandler   *auth.TokenHandler
	bookHandler    *books.BookHandler
	authMiddleware func(http.Handler) http.Handler
	handler        http.Handler
}

// NewRouter creates a new router with all routes registered and middleware applied.
func NewRouter(db *database.DB, cfg *config.Config) *Router {
	// Build user and auth dependencies
	userRepo := users.NewUserRepository(db.Pool)
	userService := users.NewUserService(userRepo)
	refreshTokenRepo := auth.NewRefreshTokenRepository(db.Pool)

	accessTokenExpiry, err := auth.ParseExpiry(cfg.AccessTokenExpiry)
	if err != nil {
		accessTokenExpiry = 15 * time.Minute
	}
	refreshTokenExpiry, err := auth.ParseExpiry(cfg.RefreshTokenExpiry)
	if err != nil {
		refreshTokenExpiry = 7 * 24 * time.Hour
	}

	authService := auth.NewAuthService(
		userService,
		refreshTokenRepo,
		email.NewDevEmailSender(),
		cfg.JWTAccessSecret,
		cfg.JWTRefreshSecret,
		accessTokenExpiry,
		refreshTokenExpiry,
	)
	authHandler := auth.NewAuthHandler(authService)
	tokenHandler := auth.NewTokenHandler(authService)
	authMiddleware := auth.AuthMiddleware(cfg.JWTAccessSecret)

	// Build book dependencies (Phase 7)
	bookRepo := books.NewBookRepository(db.Pool)
	chapterRepo := books.NewChapterRepository(db.Pool)
	bookHandler := books.NewBookHandler(books.NewBookService(bookRepo, chapterRepo))

	r := &Router{
		mux:            http.NewServeMux(),
		db:             db,
		cfg:            cfg,
		authHandler:    authHandler,
		tokenHandler:   tokenHandler,
		bookHandler:    bookHandler,
		authMiddleware: authMiddleware,
	}
	r.registerRoutes()

	// Build the middleware chain ONCE so rate limiter state persists between requests.
	var handler http.Handler = r.mux
	handler = middleware.Recover(handler)
	handler = middleware.RateLimit(10, 60, time.Minute)(handler)
	handler = middleware.CORS(r.cfg.FrontendURL)(handler)
	handler = middleware.Logger(handler)
	r.handler = handler

	return r
}

// registerRoutes registers all application routes.
func (r *Router) registerRoutes() {
	// Health check
	r.mux.HandleFunc("GET /health", r.handleHealth)

	// Auth routes
	r.mux.HandleFunc("POST /api/v1/auth/signup", r.authHandler.Signup)
	r.mux.HandleFunc("POST /api/v1/auth/login", r.authHandler.Login)
	r.mux.HandleFunc("POST /api/v1/auth/refresh", r.tokenHandler.Refresh)
	r.mux.HandleFunc("POST /api/v1/auth/forgot-password", r.tokenHandler.ForgotPassword)
	r.mux.HandleFunc("POST /api/v1/auth/reset-password", r.tokenHandler.ResetPassword)

	// Authenticated routes
	r.mux.Handle("POST /api/v1/auth/logout", r.authMiddleware(http.HandlerFunc(r.tokenHandler.Logout)))
	r.mux.Handle("GET /api/v1/me", r.authMiddleware(http.HandlerFunc(r.tokenHandler.Me)))

	// Public book routes (Phase 7)
	r.mux.HandleFunc("GET /api/v1/books", r.bookHandler.List)
	r.mux.HandleFunc("GET /api/v1/books/{slug}", r.bookHandler.GetBySlug)
	r.mux.HandleFunc("GET /api/v1/books/{slug}/chapters", r.bookHandler.ListChapters)
	r.mux.HandleFunc("GET /api/v1/books/{slug}/chapters/{chapterSlug}", r.bookHandler.GetChapter)
}

// handleHealth returns the health status of the API.
func (r *Router) handleHealth(w http.ResponseWriter, req *http.Request) {
	writeJSON(w, http.StatusOK, map[string]string{"status": "ok"})
}

// ServeHTTP implements http.Handler.
func (r *Router) ServeHTTP(w http.ResponseWriter, req *http.Request) {
	r.handler.ServeHTTP(w, req)
}
