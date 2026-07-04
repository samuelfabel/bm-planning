package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/msi/bm-planning/server/internal/api/response"
	"github.com/msi/bm-planning/server/internal/services"
)

/** Write a service or internal error as RFC 7807 Problem JSON on the response.
 *
 * @param c - Gin request context.
 * @param err - Error to serialize; nil is ignored.
 */
func writeServiceError(c *gin.Context, err error) {
	if err == nil {
		return
	}
	if serviceErr, ok := err.(*services.ServiceError); ok {
		response.ProblemJSON(c, serviceErr.Status, serviceErr.Code, serviceErr.Message)
		return
	}
	response.ProblemJSON(c, http.StatusInternalServerError, "internal_error", err.Error())
}
