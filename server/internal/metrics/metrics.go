package metrics

import (
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/prometheus/client_golang/prometheus"
	"github.com/prometheus/client_golang/prometheus/promauto"
	"github.com/prometheus/client_golang/prometheus/promhttp"
)

var (
	RoomsActive = promauto.NewGauge(prometheus.GaugeOpts{
		Name: "rooms_active",
		Help: "Number of active planning rooms.",
	})

	WSConnections = promauto.NewGauge(prometheus.GaugeOpts{
		Name: "ws_connections",
		Help: "Number of active WebSocket connections.",
	})

	HTTPRequestsTotal = promauto.NewCounterVec(prometheus.CounterOpts{
		Name: "http_requests_total",
		Help: "Total HTTP requests processed.",
	}, []string{"method", "path", "status"})
)

// Handler exposes Prometheus metrics at GET /metrics.
func Handler() gin.HandlerFunc {
	h := promhttp.Handler()
	return func(c *gin.Context) {
		h.ServeHTTP(c.Writer, c.Request)
	}
}

// Middleware increments http_requests_total for each request.
func Middleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		c.Next()
		HTTPRequestsTotal.WithLabelValues(
			c.Request.Method,
			c.FullPath(),
			strconv.Itoa(c.Writer.Status()),
		).Inc()
	}
}
