package static

import (
	"io/fs"
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
)

const distRoot = "dist"

/** Serve embedded static assets and fall back to index.html for client routes.
 *
 * Call from main after API routes are registered on the router.
 *
 * @param router - Gin engine instance.
 */
func RegisterSPA(router *gin.Engine) {
	sub, err := fs.Sub(Dist, distRoot)
	if err != nil {
		panic("static: embed dist: " + err.Error())
	}
	fileServer := http.FileServer(http.FS(sub))

	router.NoRoute(func(c *gin.Context) {
		if c.Request.Method != http.MethodGet && c.Request.Method != http.MethodHead {
			c.Status(http.StatusMethodNotAllowed)
			return
		}

		path := c.Request.URL.Path
		if isReserved(path) {
			c.Status(http.StatusNotFound)
			return
		}

		clean := strings.TrimPrefix(path, "/")
		if clean == "" {
			serveIndex(c, sub)
			return
		}

		if f, err := sub.Open(clean); err == nil {
			_ = f.Close()
			fileServer.ServeHTTP(c.Writer, c.Request)
			return
		}

		serveIndex(c, sub)
	})
}

/** Return true when the path must not be served by the SPA file server.
 *
 * @param path - Request URL path.
 * @returns True for API, health, ready, and metrics routes.
 */
func isReserved(path string) bool {
	return strings.HasPrefix(path, "/api/") ||
		path == "/health" ||
		path == "/ready" ||
		path == "/metrics"
}

/** Serve embedded index.html for client-side routing fallback.
 *
 * @param c - Gin request context.
 * @param sub - Embedded dist filesystem root.
 */
func serveIndex(c *gin.Context, sub fs.FS) {
	data, err := fs.ReadFile(sub, "index.html")
	if err != nil {
		c.String(http.StatusInternalServerError, "index.html not found in embedded assets")
		return
	}
	c.Data(http.StatusOK, "text/html; charset=utf-8", data)
}
