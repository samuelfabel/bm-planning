package response

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

func JSON(c *gin.Context, status int, payload any) {
	c.JSON(status, payload)
}

func OK(c *gin.Context, payload any) {
	c.JSON(http.StatusOK, payload)
}
