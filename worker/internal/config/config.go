// Version: 1.0.0
// Purpose: Configuration struct and loader for evi-worker.
//          Reads environment variables populated by godotenv.Load() in main.go.
// Backend file: config.go

package config

import "os"

// Config holds all runtime configuration values for evi-worker.
type Config struct {
	DatabaseURL    string
	ValkeyURL      string
	ValkeyPassword string
	LogLevel       string
	LogFormat      string
}

// Load builds Config from environment variables.
// Must be called after godotenv.Load() in main.go so that .env values are visible.
func Load() *Config {
	return &Config{
		DatabaseURL:    getEnv("DATABASE_URL", "postgresql://app_service:P@ssw0rd@localhost:5445/maindb"),
		ValkeyURL:      getEnv("VALKEY_URL", "localhost:6379"),
		ValkeyPassword: getEnv("VALKEY_PASSWORD", ""),
		LogLevel:       getEnv("LOG_LEVEL", "debug"),
		LogFormat:      getEnv("LOG_FORMAT", "pretty"),
	}
}

// getEnv returns the value of key from the environment, or defaultVal if not set.
func getEnv(key, defaultVal string) string {
	if value, exists := os.LookupEnv(key); exists {
		return value
	}
	return defaultVal
}
