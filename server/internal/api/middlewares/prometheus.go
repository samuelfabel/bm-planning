package middlewares

import (
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/msi/bm-planning/server/internal/metrics"
)

func Prometheus() gin.HandlerFunc {
	return func(c *gin.Context) {
		c.Next()
		metrics.HTTPRequestsTotal.WithLabelValues(
			c.Request.Method,
			c.FullPath(),
			strconv.Itoa(c.Writer.Status()),
		).Inc()
	}
}
