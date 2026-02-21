// Version: 1.0.0
// Purpose: Entry point for evi-worker. Bootstraps config, zerolog, PostgreSQL, Valkey,
//          and the polling loop. Handles graceful shutdown on SIGINT/SIGTERM.
// Backend file: main.go

package main

import (
	"context"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/joho/godotenv"
	"github.com/rs/zerolog"
	"github.com/rs/zerolog/log"

	"github.com/vk74/evi/worker/internal/config"
	"github.com/vk74/evi/worker/internal/infra"
	"github.com/vk74/evi/worker/internal/worker"
)

func main() {
	// Load .env before reading any env vars; ignore error if file is absent
	_ = godotenv.Load()

	// Configure zerolog output format and level from env vars
	setupLogger()

	cfg := config.Load()
	log.Info().
		Str("logLevel", cfg.LogLevel).
		Str("logFormat", cfg.LogFormat).
		Msg("evi-worker starting")

	// Use a timeout context for all startup I/O operations
	initCtx, cancelInit := context.WithTimeout(context.Background(), 15*time.Second)
	defer cancelInit()

	db, err := infra.NewDB(initCtx, cfg.DatabaseURL)
	if err != nil {
		log.Fatal().Err(err).Msg("Failed to connect to PostgreSQL")
	}
	defer db.Close()

	valkeyClient, err := infra.NewValkey(initCtx, cfg.ValkeyURL, cfg.ValkeyPassword)
	if err != nil {
		log.Fatal().Err(err).Msg("Failed to connect to Valkey")
	}
	defer valkeyClient.Close()

	// Worker lifecycle context — cancelled on shutdown signal
	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()

	poller := worker.NewPoller(db, valkeyClient)
	go poller.Run(ctx)

	// Block until SIGINT (Ctrl+C) or SIGTERM (container stop)
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	sig := <-quit

	log.Info().Str("signal", sig.String()).Msg("Shutdown signal received, stopping...")
	cancel()

	// Brief drain window for the poller goroutine to exit cleanly
	time.Sleep(500 * time.Millisecond)
	log.Info().Msg("evi-worker stopped")
}

// setupLogger configures the global zerolog logger.
// LOG_FORMAT=pretty (default) → colored human-readable output for dev terminals.
// LOG_FORMAT=json → structured JSON lines for production / container log collectors.
func setupLogger() {
	lvl, err := zerolog.ParseLevel(os.Getenv("LOG_LEVEL"))
	if err != nil || os.Getenv("LOG_LEVEL") == "" {
		lvl = zerolog.DebugLevel
	}
	zerolog.SetGlobalLevel(lvl)

	if os.Getenv("LOG_FORMAT") == "json" {
		log.Logger = zerolog.New(os.Stdout).With().Timestamp().Logger()
	} else {
		log.Logger = zerolog.New(zerolog.ConsoleWriter{
			Out:        os.Stdout,
			TimeFormat: "15:04:05",
		}).With().Timestamp().Logger()
	}
}
