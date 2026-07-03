package static

import (
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/gin-gonic/gin"
)

func TestRegisterSPA_ServesIndex(t *testing.T) {
	gin.SetMode(gin.TestMode)

	router := gin.New()
	RegisterSPA(router)

	req := httptest.NewRequest(http.MethodGet, "/setup", nil)
	rec := httptest.NewRecorder()
	router.ServeHTTP(rec, req)

	if rec.Code != http.StatusOK {
		t.Fatalf("status = %d, want 200", rec.Code)
	}
	if rec.Header().Get("Content-Type") != "text/html; charset=utf-8" {
		t.Fatalf("content-type = %q", rec.Header().Get("Content-Type"))
	}
}

func TestRegisterSPA_ReservedPaths(t *testing.T) {
	gin.SetMode(gin.TestMode)

	router := gin.New()
	RegisterSPA(router)

	req := httptest.NewRequest(http.MethodGet, "/api/v1/rooms", nil)
	rec := httptest.NewRecorder()
	router.ServeHTTP(rec, req)

	if rec.Code != http.StatusNotFound {
		t.Fatalf("status = %d, want 404 for reserved API prefix", rec.Code)
	}
}
