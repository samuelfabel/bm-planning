package config

import (
	"os"
	"testing"
)

func TestLoadAllowedOriginsPrecedence(t *testing.T) {
	t.Setenv("ALLOWED_ORIGINS", "https://a.example.com")
	t.Setenv("CORS_ORIGINS", "https://b.example.com")

	cfg := Load()
	if len(cfg.AllowedOrigins) != 1 || cfg.AllowedOrigins[0] != "https://a.example.com" {
		t.Fatalf("AllowedOrigins = %#v, want [https://a.example.com]", cfg.AllowedOrigins)
	}
}

func TestLoadCORSOriginsFallback(t *testing.T) {
	t.Setenv("ALLOWED_ORIGINS", "")
	os.Unsetenv("ALLOWED_ORIGINS")
	t.Setenv("CORS_ORIGINS", "https://b.example.com,https://c.example.com")

	cfg := Load()
	if len(cfg.AllowedOrigins) != 2 {
		t.Fatalf("AllowedOrigins = %#v, want 2 entries", cfg.AllowedOrigins)
	}
}

func TestLoadRateLimitAlias(t *testing.T) {
	t.Setenv("HTTP_RATE_LIMIT_PER_MIN", "")
	os.Unsetenv("HTTP_RATE_LIMIT_PER_MIN")
	t.Setenv("RATE_LIMIT_PER_MIN", "30")

	cfg := Load()
	if cfg.HTTPRateLimitPerMin != 30 {
		t.Fatalf("HTTPRateLimitPerMin = %d, want 30", cfg.HTTPRateLimitPerMin)
	}
}
