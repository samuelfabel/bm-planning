package middlewares

import (
	"net/http"
	"sync"
	"time"

	"github.com/gin-gonic/gin"
	"golang.org/x/time/rate"
)

const (
	defaultRateLimitPerMinute = 60
	limiterCleanupInterval    = 5 * time.Minute
	limiterIdleTTL            = 10 * time.Minute
)

type ipLimiter struct {
	limiter  *rate.Limiter
	lastSeen time.Time
}

var (
	limiterMu sync.Mutex
	limiters  = map[string]*ipLimiter{}
)

func init() {
	go cleanupLimiters()
}

// RateLimit returns middleware that limits requests to limitPerMinute per client IP.
func RateLimit(limitPerMinute int) gin.HandlerFunc {
	if limitPerMinute <= 0 {
		limitPerMinute = defaultRateLimitPerMinute
	}
	interval := time.Minute / time.Duration(limitPerMinute)
	burst := limitPerMinute

	return func(c *gin.Context) {
		ip := c.ClientIP()
		lim := getLimiter(ip, rate.Every(interval), burst)
		if !lim.Allow() {
			c.AbortWithStatusJSON(http.StatusTooManyRequests, gin.H{
				"title":  "Too Many Requests",
				"status": http.StatusTooManyRequests,
				"detail": "Rate limit exceeded. Try again later.",
			})
			return
		}
		c.Next()
	}
}

/** Return or create the token-bucket limiter for a client IP.
 *
 * @param ip - Client IP address.
 * @param every - Rate limit interval between allowed requests.
 * @param burst - Maximum burst size.
 * @returns Shared limiter for the IP.
 */
func getLimiter(ip string, every rate.Limit, burst int) *rate.Limiter {
	limiterMu.Lock()
	defer limiterMu.Unlock()

	entry, ok := limiters[ip]
	if !ok {
		entry = &ipLimiter{
			limiter:  rate.NewLimiter(every, burst),
			lastSeen: time.Now(),
		}
		limiters[ip] = entry
		return entry.limiter
	}

	entry.lastSeen = time.Now()
	return entry.limiter
}

/** Periodically remove idle IP limiters from the in-memory map.
 *
 * Runs until the process exits; started from init.
 */
func cleanupLimiters() {
	ticker := time.NewTicker(limiterCleanupInterval)
	defer ticker.Stop()

	for range ticker.C {
		cutoff := time.Now().Add(-limiterIdleTTL)
		limiterMu.Lock()
		for ip, entry := range limiters {
			if entry.lastSeen.Before(cutoff) {
				delete(limiters, ip)
			}
		}
		limiterMu.Unlock()
	}
}
