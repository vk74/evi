// Version: 1.0.0
// Purpose: Valkey/Redis client setup for evi-worker using go-redis/v9.
//          Connects to the evi-state container. go-redis/v9 is fully compatible with Valkey.
// Backend file: valkey.go

package infra

import (
	"context"
	"fmt"

	"github.com/redis/go-redis/v9"
	"github.com/rs/zerolog/log"
)

// NewValkey creates a go-redis/v9 client and verifies connectivity via PING.
// addr format: "host:port" (e.g. "localhost:6379").
func NewValkey(ctx context.Context, addr, password string) (*redis.Client, error) {
	log.Info().Str("addr", addr).Msg("Connecting to Valkey...")

	client := redis.NewClient(&redis.Options{
		Addr:     addr,
		Password: password,
		DB:       0,
	})

	if err := client.Ping(ctx).Err(); err != nil {
		_ = client.Close()
		return nil, fmt.Errorf("ping valkey: %w", err)
	}

	log.Info().Msg("Valkey connected")
	return client, nil
}
