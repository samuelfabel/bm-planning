package response

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

/** Write a JSON response with the given status code.
 *
 * @param c - Gin request context.
 * @param status - HTTP status code.
 * @param payload - Serializable response body.
 */
func JSON(c *gin.Context, status int, payload any) {
	c.JSON(status, payload)
}

/** Write a 200 OK JSON response.
 *
 * @param c - Gin request context.
 * @param payload - Serializable response body.
 */
func OK(c *gin.Context, payload any) {
	c.JSON(http.StatusOK, payload)
}
