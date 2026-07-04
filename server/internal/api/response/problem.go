package response

import (
	"github.com/gin-gonic/gin"
)

type Problem struct {
	Type     string `json:"type,omitempty"`
	Title    string `json:"title"`
	Status   int    `json:"status"`
	Detail   string `json:"detail,omitempty"`
	Instance string `json:"instance,omitempty"`
}

/** Write an RFC 7807 problem+json error response.
 *
 * @param c - Gin request context.
 * @param status - HTTP status code.
 * @param title - Short error title.
 * @param detail - Human-readable error detail.
 */
func ProblemJSON(c *gin.Context, status int, title, detail string) {
	c.Header("Content-Type", "application/problem+json")
	c.JSON(status, Problem{
		Title:  title,
		Status: status,
		Detail: detail,
	})
}
