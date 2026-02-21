package config

import (
	"log/slog"
	"os"

	"github.com/joho/godotenv"
)

type Config struct {
	APIPort     string
	DatabaseURL string
	JWTSecret   string
}

// Load reads configuration from .env file and environment variables
func Load() *Config {
	// Try to load .env file if it exists
	if err := godotenv.Load(); err != nil {
		slog.Info("No .env file found or error reading it. Using existing environment variables.")
	}

	cfg := &Config{
		APIPort:     getEnv("API_PORT", "7777"),
		DatabaseURL: getEnv("DATABASE_URL", "postgresql://app_service:P@ssw0rd@localhost:5445/maindb"),
		JWTSecret:   getEnv("JWT_PRIVATE_KEY", "your-super-secret-jwt-key"), // default for local dev
	}

	return cfg
}

func getEnv(key, defaultVal string) string {
	if value, exists := os.LookupEnv(key); exists {
		return value
	}
	return defaultVal
}
