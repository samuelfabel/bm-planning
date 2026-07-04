package middlewares

import (
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/msi/bm-planning/server/internal/metrics"
)

/** Return middleware that increments Prometheus HTTP request counters.
 *
 * @returns Gin middleware handler.
 */
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
