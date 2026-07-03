package handlers

import (
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/gin-gonic/gin"
)

func TestSwaggerDocs(t *testing.T) {
	gin.SetMode(gin.TestMode)
	router := gin.New()
	RegisterDocs(router)

	t.Run("openapi yaml", func(t *testing.T) {
		req := httptest.NewRequest(http.MethodGet, "/api/docs/openapi.yaml", nil)
		rec := httptest.NewRecorder()
		router.ServeHTTP(rec, req)

		if rec.Code != http.StatusOK {
			t.Fatalf("status = %d, want 200", rec.Code)
		}
		if !strings.Contains(rec.Body.String(), "openapi: 3") {
			t.Fatalf("expected openapi spec body")
		}
	})

	t.Run("swagger ui", func(t *testing.T) {
		req := httptest.NewRequest(http.MethodGet, "/api/docs", nil)
		rec := httptest.NewRecorder()
		router.ServeHTTP(rec, req)

		if rec.Code != http.StatusOK {
			t.Fatalf("status = %d, want 200", rec.Code)
		}
		if !strings.Contains(rec.Body.String(), "swagger-ui") {
			t.Fatalf("expected swagger ui html")
		}
	})
}
