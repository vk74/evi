// Version: 1.0.0
// Purpose: PostgreSQL connection pool for evi-worker using pgx/v5.
//          Connects to the shared project database (evi-db container).
// Backend file: db.go

package infra

import (
	"context"
	"fmt"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/rs/zerolog/log"
)

// NewDB creates, configures, and validates a pgx/v5 connection pool.
// Returns the pool directly so callers can use pgxpool.Pool methods.
func NewDB(ctx context.Context, databaseURL string) (*pgxpool.Pool, error) {
	log.Info().Msg("Connecting to PostgreSQL...")

	cfg, err := pgxpool.ParseConfig(databaseURL)
	if err != nil {
		return nil, fmt.Errorf("parse db config: %w", err)
	}

	// Worker needs fewer connections than the API server
	cfg.MaxConns = 5
	cfg.MinConns = 1
	cfg.MaxConnLifetime = time.Hour
	cfg.MaxConnIdleTime = 30 * time.Minute

	pool, err := pgxpool.NewWithConfig(ctx, cfg)
	if err != nil {
		return nil, fmt.Errorf("connect to database: %w", err)
	}

	if err := pool.Ping(ctx); err != nil {
		pool.Close()
		return nil, fmt.Errorf("ping database: %w", err)
	}

	log.Info().Msg("PostgreSQL connected")
	return pool, nil
}
