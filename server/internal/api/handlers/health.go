package handlers

import (
	"github.com/gin-gonic/gin"
	"github.com/msi/bm-planning/server/internal/api/response"
	"github.com/msi/bm-planning/server/internal/metrics"
)

type HealthHandler struct{}

/** Handle GET /health — liveness probe.
 *
 * @param c - Gin request context.
 */
func (h *HealthHandler) Health(c *gin.Context) {
	response.OK(c, gin.H{"status": "ok"})
}

/** Handle GET /ready — readiness probe.
 *
 * @param c - Gin request context.
 */
func (h *HealthHandler) Ready(c *gin.Context) {
	response.OK(c, gin.H{"status": "ready"})
}

/** Register health, readiness, and metrics routes on the root router.
 *
 * @param router - Gin engine instance.
 */
func (h *HealthHandler) SetupRoutes(router *gin.Engine) {
	router.GET("/health", h.Health)
	router.GET("/ready", h.Ready)
	router.GET("/metrics", metrics.Handler())
}
