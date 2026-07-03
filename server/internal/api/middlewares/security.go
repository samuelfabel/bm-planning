package middlewares

import "github.com/gin-gonic/gin"

// SecurityHeaders adds baseline HTTP security headers for the embedded SPA.
func SecurityHeaders() gin.HandlerFunc {
	csp := "default-src 'self'; " +
		"script-src 'self'; " +
		"style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; " +
		"font-src 'self' https://fonts.gstatic.com; " +
		"img-src 'self' data: https:; " +
		"connect-src 'self' https: wss:; " +
		"frame-ancestors 'none'; " +
		"base-uri 'self'"

	return func(c *gin.Context) {
		c.Header("X-Content-Type-Options", "nosniff")
		c.Header("X-Frame-Options", "DENY")
		c.Header("Referrer-Policy", "strict-origin-when-cross-origin")
		c.Header("Content-Security-Policy", csp)
		c.Next()
	}
}
