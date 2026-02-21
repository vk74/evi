// Version: 1.0.0
// Purpose: Mock polling loop for evi-worker.
//          Ticks every second and logs "Waiting for jobs..." until context is cancelled.
//          Placeholder for the real Valkey queue consumer (XREADGROUP / BLPOP).
// Backend file: poller.go

package worker

import (
	"context"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/redis/go-redis/v9"
	"github.com/rs/zerolog/log"
)

// Poller holds infrastructure dependencies and drives the job processing loop.
type Poller struct {
	db     *pgxpool.Pool
	valkey *redis.Client
}

// NewPoller creates a Poller with injected DB and Valkey dependencies.
func NewPoller(db *pgxpool.Pool, valkey *redis.Client) *Poller {
	return &Poller{db: db, valkey: valkey}
}

// Run starts the polling loop. Blocks until ctx is cancelled.
// Each tick logs a heartbeat message; real queue reads will replace this.
func (p *Poller) Run(ctx context.Context) {
	ticker := time.NewTicker(time.Second)
	defer ticker.Stop()

	log.Info().Msg("Poller started, waiting for jobs...")

	for {
		select {
		case <-ctx.Done():
			log.Info().Msg("Poller stopped")
			return
		case <-ticker.C:
			log.Debug().Msg("Waiting for jobs...")
		}
	}
}
