package handlers

import (
	"github.com/gin-gonic/gin"
	"github.com/msi/bm-planning/server/internal/api/response"
	"github.com/msi/bm-planning/server/internal/metrics"
)

type HealthHandler struct{}

func (h *HealthHandler) Health(c *gin.Context) {
	response.OK(c, gin.H{"status": "ok"})
}

func (h *HealthHandler) Ready(c *gin.Context) {
	response.OK(c, gin.H{"status": "ready"})
}

func (h *HealthHandler) SetupRoutes(router *gin.Engine) {
	router.GET("/health", h.Health)
	router.GET("/ready", h.Ready)
	router.GET("/metrics", metrics.Handler())
}
