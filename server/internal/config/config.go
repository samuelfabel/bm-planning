package config

import (
	"os"
	"strconv"
	"time"
)

type Config struct {
	Port                     string
	AllowedOrigins           []string
	RoomTTL                  string
	MaxParticipants          int
	RoomGraceAfterDisconnect time.Duration
	HTTPRateLimitPerMin      int
	RedisURL                 string
}

func Load() Config {
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	origins := []string{"http://localhost:5173", "http://127.0.0.1:5173"}
	if v := os.Getenv("ALLOWED_ORIGINS"); v != "" {
		origins = splitCSV(v)
	} else if v := os.Getenv("CORS_ORIGINS"); v != "" {
		origins = splitCSV(v)
	}

	roomTTL := os.Getenv("ROOM_TTL")
	if roomTTL == "" {
		roomTTL = "4h"
	}
	maxParticipants := 50
	if v := os.Getenv("MAX_PARTICIPANTS"); v != "" {
		if parsed, err := strconv.Atoi(v); err == nil && parsed > 0 {
			maxParticipants = parsed
		}
	}
	roomGraceAfterDisconnect := time.Hour
	if v := os.Getenv("ROOM_GRACE_AFTER_DISCONNECT"); v != "" {
		if parsed, err := time.ParseDuration(v); err == nil {
			roomGraceAfterDisconnect = parsed
		}
	}
	httpRateLimitPerMin := 60
	if v := os.Getenv("HTTP_RATE_LIMIT_PER_MIN"); v != "" {
		if parsed, err := strconv.Atoi(v); err == nil && parsed > 0 {
			httpRateLimitPerMin = parsed
		}
	} else if v := os.Getenv("RATE_LIMIT_PER_MIN"); v != "" {
		if parsed, err := strconv.Atoi(v); err == nil && parsed > 0 {
			httpRateLimitPerMin = parsed
		}
	}

	return Config{
		Port:                     port,
		AllowedOrigins:           origins,
		RoomTTL:                  roomTTL,
		MaxParticipants:          maxParticipants,
		RoomGraceAfterDisconnect: roomGraceAfterDisconnect,
		HTTPRateLimitPerMin:      httpRateLimitPerMin,
		RedisURL:                 os.Getenv("REDIS_URL"),
	}
}

func splitCSV(s string) []string {
	var out []string
	for _, part := range splitOnComma(s) {
		if part != "" {
			out = append(out, part)
		}
	}
	return out
}

func splitOnComma(s string) []string {
	var parts []string
	start := 0
	for i := 0; i <= len(s); i++ {
		if i == len(s) || s[i] == ',' {
			parts = append(parts, trimSpace(s[start:i]))
			start = i + 1
		}
	}
	return parts
}

func trimSpace(s string) string {
	for len(s) > 0 && (s[0] == ' ' || s[0] == '\t') {
		s = s[1:]
	}
	for len(s) > 0 && (s[len(s)-1] == ' ' || s[len(s)-1] == '\t') {
		s = s[:len(s)-1]
	}
	return s
}
