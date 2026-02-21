package main

import (
	"context"
	"log/slog"
	"net/http"
	"os"
	"os/signal"
	"time"

	"github.com/labstack/echo/v4"
	echomiddleware "github.com/labstack/echo/v4/middleware"
	"github.com/vk74/evi/be/src/core/auth"
	"github.com/vk74/evi/be/src/core/config"
	"github.com/vk74/evi/be/src/core/database"
	"github.com/vk74/evi/be/src/core/middleware"
	"github.com/vk74/evi/be/src/core/public"
)

func main() {
	// Initialize configuration
	cfg := config.Load()

	// Initialize database connection
	ctx, cancelDB := context.WithTimeout(context.Background(), 10*time.Second)
	db, err := database.New(ctx, cfg.DatabaseURL)
	cancelDB()
	if err != nil {
		slog.Error("Failed to connect to database", "error", err)
		os.Exit(1)
	}
	defer db.Close()

	// Initialize Echo router
	e := echo.New()

	// Core middleware
	e.Use(echomiddleware.Logger())
	e.Use(echomiddleware.Recover())
	
	// CORS middleware configuration
	e.Use(echomiddleware.CORSWithConfig(echomiddleware.CORSConfig{
		AllowOrigins: []string{"http://localhost:8080", "http://localhost:3000"}, // Adjust for frontend
		AllowMethods: []string{http.MethodGet, http.MethodPut, http.MethodPost, http.MethodDelete, http.MethodOptions},
		AllowHeaders: []string{echo.HeaderOrigin, echo.HeaderContentType, echo.HeaderAccept, echo.HeaderAuthorization},
		AllowCredentials: true,
	}))

	// Public routes
	e.GET("/api/health", func(c echo.Context) error {
		// Ping database to ensure health status is accurate
		if err := db.Pool.Ping(c.Request().Context()); err != nil {
			return c.JSON(http.StatusServiceUnavailable, map[string]string{
				"status": "database_error",
				"engine": "go",
			})
		}
		return c.JSON(http.StatusOK, map[string]string{
			"status": "ok",
			"engine": "go",
		})
	})

	authHandler := auth.NewHandler(db.Pool)
	e.POST("/api/auth/login", authHandler.Login)

	publicHandler := public.NewHandler(db.Pool)
	e.GET("/api/public/settings", publicHandler.FetchPublicSettings)

	// Protected routes group (requires JWT)
	protected := e.Group("/api/protected")
	protected.Use(middleware.Auth(cfg.JWTSecret))
	
	protected.GET("/profile", func(c echo.Context) error {
		userID := c.Get("user_id")
		return c.JSON(http.StatusOK, map[string]interface{}{
			"message": "Welcome to the protected zone",
			"user_id": userID,
		})
	})

	// Start server in a goroutine for graceful shutdown
	go func() {
		slog.Info("Starting Go backend", "port", cfg.APIPort)
		if err := e.Start(":" + cfg.APIPort); err != nil && err != http.ErrServerClosed {
			e.Logger.Fatal("Shutting down the server")
		}
	}()

	// Graceful Shutdown on SIGINT or SIGTERM
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, os.Interrupt)
	<-quit

	ctxShutdown, cancelShutdown := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancelShutdown()

	slog.Info("Shutting down gracefully...")
	if err := e.Shutdown(ctxShutdown); err != nil {
		e.Logger.Fatal(err)
	}
}
