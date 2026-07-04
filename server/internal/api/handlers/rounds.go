package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/msi/bm-planning/server/internal/api/response"
	"github.com/msi/bm-planning/server/internal/services"
)

type RoundsHandler struct {
	votingService *services.VotingService
}

/** Construct an HTTP handler for voting round endpoints.
 *
 * @param votingService - Voting business logic service.
 * @returns Configured RoundsHandler instance.
 */
func NewRoundsHandler(votingService *services.VotingService) *RoundsHandler {
	return &RoundsHandler{votingService: votingService}
}

/** Register round REST routes on the API router group.
 *
 * @param api - Gin router group for /api/v1 routes.
 */
func (h *RoundsHandler) SetupRoutes(api *gin.RouterGroup) {
	api.POST("/rooms/:id/rounds/start", h.StartRound)
	api.POST("/rooms/:id/rounds/vote", h.Vote)
	api.POST("/rooms/:id/rounds/reveal", h.Reveal)
	api.POST("/rooms/:id/rounds/revote", h.Revote)
	api.POST("/rooms/:id/rounds/consensus", h.Consensus)
	api.POST("/rooms/:id/rounds/skip", h.Skip)
	api.POST("/rooms/:id/rounds/next", h.Next)
}

/** Handle POST /rooms/:id/rounds/start — start a voting round.
 *
 * @param c - Gin request context.
 */
func (h *RoundsHandler) StartRound(c *gin.Context) {
	roomID := c.Param("id")
	var req struct {
		UserID string `json:"user_id"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		response.ProblemJSON(c, http.StatusBadRequest, "invalid_body", err.Error())
		return
	}
	session, err := h.votingService.StartRound(roomID, req.UserID)
	if err != nil {
		writeServiceError(c, err)
		return
	}
	response.OK(c, session)
}

/** Handle POST /rooms/:id/rounds/vote — cast or update a vote.
 *
 * @param c - Gin request context.
 */
func (h *RoundsHandler) Vote(c *gin.Context) {
	roomID := c.Param("id")
	var req struct {
		UserID string `json:"user_id"`
		Value  string `json:"value"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		response.ProblemJSON(c, http.StatusBadRequest, "invalid_body", err.Error())
		return
	}
	session, err := h.votingService.Vote(roomID, req.UserID, req.Value)
	if err != nil {
		writeServiceError(c, err)
		return
	}
	response.OK(c, session)
}

/** Handle POST /rooms/:id/rounds/reveal — reveal votes and compute consensus.
 *
 * @param c - Gin request context.
 */
func (h *RoundsHandler) Reveal(c *gin.Context) {
	roomID := c.Param("id")
	var req struct {
		UserID string `json:"user_id"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		response.ProblemJSON(c, http.StatusBadRequest, "invalid_body", err.Error())
		return
	}
	session, err := h.votingService.Reveal(roomID, req.UserID)
	if err != nil {
		writeServiceError(c, err)
		return
	}
	response.OK(c, session)
}

/** Handle POST /rooms/:id/rounds/revote — reset the active round for revoting.
 *
 * @param c - Gin request context.
 */
func (h *RoundsHandler) Revote(c *gin.Context) {
	roomID := c.Param("id")
	var req struct {
		UserID string `json:"user_id"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		response.ProblemJSON(c, http.StatusBadRequest, "invalid_body", err.Error())
		return
	}
	session, err := h.votingService.Revote(roomID, req.UserID)
	if err != nil {
		writeServiceError(c, err)
		return
	}
	response.OK(c, session)
}

/** Handle POST /rooms/:id/rounds/consensus — apply a consensus estimate.
 *
 * @param c - Gin request context.
 */
func (h *RoundsHandler) Consensus(c *gin.Context) {
	roomID := c.Param("id")
	var req struct {
		UserID string `json:"user_id"`
		Value  string `json:"value"`
		Sync   bool   `json:"sync_to_businessmap"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		response.ProblemJSON(c, http.StatusBadRequest, "invalid_body", err.Error())
		return
	}
	session, err := h.votingService.ApplyConsensus(roomID, req.UserID, req.Value, req.Sync)
	if err != nil {
		writeServiceError(c, err)
		return
	}
	response.OK(c, session)
}

/** Handle POST /rooms/:id/rounds/skip — skip the current card.
 *
 * @param c - Gin request context.
 */
func (h *RoundsHandler) Skip(c *gin.Context) {
	roomID := c.Param("id")
	var req struct {
		UserID string `json:"user_id"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		response.ProblemJSON(c, http.StatusBadRequest, "invalid_body", err.Error())
		return
	}
	session, err := h.votingService.Skip(roomID, req.UserID)
	if err != nil {
		writeServiceError(c, err)
		return
	}
	response.OK(c, session)
}

/** Handle POST /rooms/:id/rounds/next — advance to the next queue card.
 *
 * @param c - Gin request context.
 */
func (h *RoundsHandler) Next(c *gin.Context) {
	roomID := c.Param("id")
	var req struct {
		UserID string `json:"user_id"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		response.ProblemJSON(c, http.StatusBadRequest, "invalid_body", err.Error())
		return
	}
	session, err := h.votingService.Next(roomID, req.UserID)
	if err != nil {
		writeServiceError(c, err)
		return
	}
	response.OK(c, session)
}
