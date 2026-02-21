package database

import (
	"context"
	"fmt"
	"log/slog"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
)

type DB struct {
	Pool *pgxpool.Pool
}

// New connects to the PostgreSQL database and returns a connection pool
func New(ctx context.Context, databaseURL string) (*DB, error) {
	slog.Info("Connecting to database...")

	config, err := pgxpool.ParseConfig(databaseURL)
	if err != nil {
		return nil, fmt.Errorf("unable to parse database config: %w", err)
	}

	// Configure connection pool settings (similar to typical Node.js pg settings)
	config.MaxConns = 10
	config.MinConns = 2
	config.MaxConnLifetime = time.Hour
	config.MaxConnIdleTime = 30 * time.Minute

	pool, err := pgxpool.NewWithConfig(ctx, config)
	if err != nil {
		return nil, fmt.Errorf("unable to connect to database: %w", err)
	}

	// Ping the database to ensure connection is established
	if err := pool.Ping(ctx); err != nil {
		return nil, fmt.Errorf("unable to ping database: %w", err)
	}

	slog.Info("Successfully connected to the database")

	return &DB{Pool: pool}, nil
}

// Close gracefully closes all database connections
func (db *DB) Close() {
	slog.Info("Closing database connection pool")
	db.Pool.Close()
}
