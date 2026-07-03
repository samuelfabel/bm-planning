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

func ProblemJSON(c *gin.Context, status int, title, detail string) {
	c.Header("Content-Type", "application/problem+json")
	c.JSON(status, Problem{
		Title:  title,
		Status: status,
		Detail: detail,
	})
}
