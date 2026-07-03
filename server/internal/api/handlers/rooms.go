package handlers

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/msi/bm-planning/server/internal/api/response"
	"github.com/msi/bm-planning/server/internal/models"
	"github.com/msi/bm-planning/server/internal/providers"
	"github.com/msi/bm-planning/server/internal/services"
)

type RoomsHandler struct {
	roomService *services.RoomService
	roomStore   *providers.RoomStore
}

func NewRoomsHandler(roomService *services.RoomService, roomStore *providers.RoomStore) *RoomsHandler {
	return &RoomsHandler{roomService: roomService, roomStore: roomStore}
}

func (h *RoomsHandler) SetupRoutes(api *gin.RouterGroup) {
	api.POST("/rooms", h.CreateRoom)
	api.GET("/rooms/:id", h.GetRoom)
	api.DELETE("/rooms/:id", h.CloseRoom)
	api.POST("/rooms/:id/join", h.JoinRoom)
	api.POST("/rooms/:id/leave", h.LeaveRoom)
	api.PUT("/rooms/:id/queue", h.UpdateQueue)
	api.PATCH("/rooms/:id/cards/:cardId", h.UpdateCard)
}

type createRoomRequest struct {
	Name        string                 `json:"name"`
	Settings    models.SessionSettings `json:"settings"`
	Queue       []models.QueuedCard    `json:"queue"`
	Facilitator struct {
		DisplayName string `json:"display_name"`
		Role        string `json:"role"`
	} `json:"facilitator"`
}

func (h *RoomsHandler) CreateRoom(c *gin.Context) {
	var req createRoomRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.ProblemJSON(c, http.StatusBadRequest, "invalid_body", err.Error())
		return
	}

	session, facilitator, err := h.roomService.CreateRoom(services.CreateRoomInput{
		Name:        req.Name,
		Settings:    req.Settings,
		Queue:       req.Queue,
		Facilitator: req.Facilitator,
	})
	if err != nil {
		writeServiceError(c, err)
		return
	}
	refreshRuntimeMetrics(h.roomStore, nil)

	response.JSON(c, http.StatusCreated, gin.H{
		"id":          session.ID,
		"join_url":    "/room/" + session.ID,
		"expires_at":  session.ExpiresAt,
		"facilitator": facilitator,
	})
}

func (h *RoomsHandler) GetRoom(c *gin.Context) {
	roomID := c.Param("id")
	session, err := h.roomService.GetRoom(roomID)
	if err != nil {
		writeServiceError(c, err)
		return
	}

	userID := c.Query("user_id")
	if userID == "" {
		response.OK(c, session)
		return
	}
	user, err := h.roomService.GetUser(roomID, userID)
	if err != nil {
		writeServiceError(c, err)
		return
	}

	response.OK(c, sessionForUser(session, user))
}

func (h *RoomsHandler) CloseRoom(c *gin.Context) {
	roomID := c.Param("id")
	var req struct {
		UserID string `json:"user_id"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		response.ProblemJSON(c, http.StatusBadRequest, "invalid_body", err.Error())
		return
	}
	if err := h.roomService.DeleteRoom(roomID, req.UserID); err != nil {
		writeServiceError(c, err)
		return
	}
	c.Status(http.StatusNoContent)
}

func (h *RoomsHandler) JoinRoom(c *gin.Context) {
	roomID := c.Param("id")
	var req struct {
		DisplayName string `json:"display_name"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		response.ProblemJSON(c, http.StatusBadRequest, "invalid_body", err.Error())
		return
	}

	user, err := h.roomService.JoinRoom(roomID, req.DisplayName)
	if err != nil {
		writeServiceError(c, err)
		return
	}
	response.JSON(c, http.StatusCreated, user)
}

func (h *RoomsHandler) LeaveRoom(c *gin.Context) {
	roomID := c.Param("id")
	var req struct {
		UserID string `json:"user_id"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		response.ProblemJSON(c, http.StatusBadRequest, "invalid_body", err.Error())
		return
	}
	if err := h.roomService.LeaveRoom(roomID, req.UserID); err != nil {
		writeServiceError(c, err)
		return
	}
	c.Status(http.StatusNoContent)
}

func (h *RoomsHandler) UpdateQueue(c *gin.Context) {
	roomID := c.Param("id")
	var req struct {
		UserID string              `json:"user_id"`
		Queue  []models.QueuedCard `json:"queue"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		response.ProblemJSON(c, http.StatusBadRequest, "invalid_body", err.Error())
		return
	}
	session, err := h.roomService.UpdateQueue(roomID, req.UserID, req.Queue)
	if err != nil {
		writeServiceError(c, err)
		return
	}
	response.OK(c, session)
}

func (h *RoomsHandler) UpdateCard(c *gin.Context) {
	roomID := c.Param("id")
	cardID, err := strconv.Atoi(c.Param("cardId"))
	if err != nil {
		response.ProblemJSON(c, http.StatusBadRequest, "invalid_card_id", "cardId must be an integer")
		return
	}
	var req struct {
		UserID             string               `json:"user_id"`
		Description        *string              `json:"description,omitempty"`
		Subtasks           []models.CardSubtask `json:"subtasks,omitempty"`
		ExcludedFromVoting *bool                `json:"excluded_from_voting,omitempty"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		response.ProblemJSON(c, http.StatusBadRequest, "invalid_body", err.Error())
		return
	}

	card, session, serviceErr := h.roomService.UpdateCard(roomID, req.UserID, services.UpdateCardInput{
		CardID:             cardID,
		Description:        req.Description,
		Subtasks:           req.Subtasks,
		ExcludedFromVoting: req.ExcludedFromVoting,
	})
	if serviceErr != nil {
		writeServiceError(c, serviceErr)
		return
	}

	response.OK(c, gin.H{
		"card": card,
		"room": session,
	})
}
