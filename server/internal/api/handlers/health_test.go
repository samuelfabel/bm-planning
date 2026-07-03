package handlers

import (
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/gin-gonic/gin"
)

func TestHealthHandler(t *testing.T) {
	gin.SetMode(gin.TestMode)

	router := gin.New()
	(&HealthHandler{}).SetupRoutes(router)

	req := httptest.NewRequest(http.MethodGet, "/health", nil)
	rec := httptest.NewRecorder()
	router.ServeHTTP(rec, req)

	if rec.Code != http.StatusOK {
		t.Fatalf("status = %d, want 200", rec.Code)
	}
	if rec.Body.String() != "{\"status\":\"ok\"}" {
		t.Fatalf("body = %q", rec.Body.String())
	}
}

func TestReadyHandler(t *testing.T) {
	gin.SetMode(gin.TestMode)

	router := gin.New()
	(&HealthHandler{}).SetupRoutes(router)

	req := httptest.NewRequest(http.MethodGet, "/ready", nil)
	rec := httptest.NewRecorder()
	router.ServeHTTP(rec, req)

	if rec.Code != http.StatusOK {
		t.Fatalf("status = %d, want 200", rec.Code)
	}
	if rec.Body.String() != "{\"status\":\"ready\"}" {
		t.Fatalf("body = %q", rec.Body.String())
	}
}

func TestMetricsHandler(t *testing.T) {
	gin.SetMode(gin.TestMode)

	router := gin.New()
	(&HealthHandler{}).SetupRoutes(router)

	req := httptest.NewRequest(http.MethodGet, "/metrics", nil)
	rec := httptest.NewRecorder()
	router.ServeHTTP(rec, req)

	if rec.Code != http.StatusOK {
		t.Fatalf("status = %d, want 200", rec.Code)
	}
	if !strings.Contains(rec.Body.String(), "rooms_active") {
		t.Fatalf("metrics body missing rooms_active: %q", rec.Body.String())
	}
	if !strings.Contains(rec.Body.String(), "ws_connections") {
		t.Fatalf("metrics body missing ws_connections")
	}
}
