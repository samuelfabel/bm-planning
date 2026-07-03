package handlers

import (
	"encoding/json"
	"errors"
	"net/http"
	"strconv"
	"sync"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/gorilla/websocket"
	"github.com/msi/bm-planning/server/internal/api/middlewares"
	"github.com/msi/bm-planning/server/internal/models"
	"github.com/msi/bm-planning/server/internal/providers"
	"github.com/msi/bm-planning/server/internal/services"
)

type WebSocketHandler struct {
	upgrader      websocket.Upgrader
	allowedOrigin []string
	hub           *providers.Hub
	roomStore     *providers.RoomStore
	roomService   *services.RoomService
	votingService *services.VotingService
}

type wsEnvelope struct {
	Type    string          `json:"type"`
	Payload json.RawMessage `json:"payload,omitempty"`
}

type wsClient struct {
	id       string
	roomID   string
	conn     *websocket.Conn
	writeMu  sync.Mutex
	userID   string
	userData *models.User
}

func (c *wsClient) ID() string {
	return c.id
}

func (c *wsClient) RoomID() string {
	return c.roomID
}

func (c *wsClient) Send(message []byte) error {
	c.writeMu.Lock()
	defer c.writeMu.Unlock()
	return c.conn.WriteMessage(websocket.TextMessage, message)
}

func NewWebSocketHandler(
	allowedOrigins []string,
	hub *providers.Hub,
	roomStore *providers.RoomStore,
	roomService *services.RoomService,
	votingService *services.VotingService,
) *WebSocketHandler {
	return &WebSocketHandler{
		allowedOrigin: allowedOrigins,
		hub:           hub,
		roomStore:     roomStore,
		roomService:   roomService,
		votingService: votingService,
		upgrader: websocket.Upgrader{
			CheckOrigin: func(r *http.Request) bool {
				origin := r.Header.Get("Origin")
				if origin == "" {
					return true
				}
				return middlewares.IsAllowedOrigin(origin, allowedOrigins)
			},
		},
	}
}

func (h *WebSocketHandler) SetupRoutes(api *gin.RouterGroup) {
	api.GET("/rooms/:id/live", h.Live)
}

func (h *WebSocketHandler) Live(c *gin.Context) {
	roomID := c.Param("id")
	if _, err := h.roomService.GetRoom(roomID); err != nil {
		writeServiceError(c, err)
		return
	}
	conn, err := h.upgrader.Upgrade(c.Writer, c.Request, nil)
	if err != nil {
		return
	}

	client := &wsClient{
		id:     "ws_" + strconv.FormatInt(time.Now().UnixNano(), 10),
		roomID: roomID,
		conn:   conn,
	}

	if err := h.roomService.MarkConnectionStart(roomID); err != nil {
		_ = conn.Close()
		return
	}
	h.hub.Register(client)
	refreshRuntimeMetrics(h.roomStore, h.hub)

	defer func() {
		h.hub.Unregister(client)
		refreshRuntimeMetrics(h.roomStore, h.hub)
		if client.userID != "" {
			_ = h.roomService.SetUserOnline(roomID, client.userID, false)
			h.broadcast(roomID, "participant_left", gin.H{"user_id": client.userID})
		}
		_ = h.roomService.MarkConnectionEnd(roomID)
		_ = conn.Close()
	}()

	for {
		_, data, err := conn.ReadMessage()
		if err != nil {
			return
		}

		var envelope wsEnvelope
		if err := json.Unmarshal(data, &envelope); err != nil {
			h.sendError(client, "invalid_message", "invalid websocket message")
			continue
		}
		if err := h.handleMessage(client, envelope); err != nil {
			h.sendError(client, "ws_action_failed", err.Error())
		}
	}
}

func (h *WebSocketHandler) handleMessage(client *wsClient, envelope wsEnvelope) error {
	switch envelope.Type {
	case "join":
		return h.handleJoin(client, envelope.Payload)
	case "ping":
		return h.send(client, "pong", nil)
	case "vote":
		if client.userData == nil {
			return errors.New("user must join before voting")
		}
		var req struct {
			Value string `json:"value"`
		}
		if err := json.Unmarshal(envelope.Payload, &req); err != nil {
			return err
		}
		_, err := h.votingService.Vote(client.roomID, client.userID, req.Value)
		if err != nil {
			return err
		}
		h.broadcast(client.roomID, "vote_received", gin.H{"user_id": client.userID})
		return nil
	case "reveal":
		if client.userData == nil {
			return errors.New("user must join before revealing")
		}
		session, err := h.votingService.Reveal(client.roomID, client.userID)
		if err != nil {
			return err
		}
		h.broadcast(client.roomID, "votes_revealed", gin.H{"votes": session.CurrentRound.Votes, "round": session.CurrentRound})
		h.broadcastRoomState(client.roomID)
		return nil
	case "start_round":
		if client.userData == nil {
			return errors.New("user must join before starting round")
		}
		session, err := h.votingService.StartRound(client.roomID, client.userID)
		if err != nil {
			return err
		}
		cardID := 0
		if session.CurrentRound != nil {
			cardID = session.CurrentRound.CardID
		}
		h.broadcast(client.roomID, "round_started", gin.H{"card_id": cardID})
		h.broadcastRoomState(client.roomID)
		return nil
	case "consensus":
		if client.userData == nil {
			return errors.New("user must join before consensus")
		}
		var req struct {
			Value string `json:"value"`
			Sync  bool   `json:"sync"`
		}
		if err := json.Unmarshal(envelope.Payload, &req); err != nil {
			return err
		}
		session, err := h.votingService.ApplyConsensus(client.roomID, client.userID, req.Value, req.Sync)
		if err != nil {
			return err
		}
		cardID := 0
		if session.CurrentRound != nil {
			cardID = session.CurrentRound.CardID
		}
		h.broadcast(client.roomID, "consensus_applied", gin.H{"card_id": cardID, "value": req.Value, "sync": req.Sync})
		h.broadcastRoomState(client.roomID)
		return nil
	case "update_card":
		if client.userData == nil {
			return errors.New("user must join before card updates")
		}
		var req struct {
			CardID             int                  `json:"card_id"`
			Description        *string              `json:"description,omitempty"`
			Subtasks           []models.CardSubtask `json:"subtasks,omitempty"`
			ExcludedFromVoting *bool                `json:"excluded_from_voting,omitempty"`
		}
		if err := json.Unmarshal(envelope.Payload, &req); err != nil {
			return err
		}
		card, _, err := h.roomService.UpdateCard(client.roomID, client.userID, services.UpdateCardInput{
			CardID:             req.CardID,
			Description:        req.Description,
			Subtasks:           req.Subtasks,
			ExcludedFromVoting: req.ExcludedFromVoting,
		})
		if err != nil {
			return err
		}
		h.broadcast(client.roomID, "card_updated", card)
		h.broadcastRoomState(client.roomID)
		return nil
	case "update_queue":
		if client.userData == nil {
			return errors.New("user must join before queue updates")
		}
		var req struct {
			Queue []models.QueuedCard `json:"queue"`
		}
		if err := json.Unmarshal(envelope.Payload, &req); err != nil {
			return err
		}
		_, err := h.roomService.UpdateQueue(client.roomID, client.userID, req.Queue)
		if err != nil {
			return err
		}
		h.broadcast(client.roomID, "queue_updated", gin.H{"queue_size": len(req.Queue)})
		h.broadcastRoomState(client.roomID)
		return nil
	default:
		return errors.New("message type not supported")
	}
}

func (h *WebSocketHandler) handleJoin(client *wsClient, payload json.RawMessage) error {
	var req struct {
		DisplayName string `json:"display_name"`
		UserID      string `json:"user_id"`
	}
	if err := json.Unmarshal(payload, &req); err != nil {
		return err
	}

	var (
		user models.User
		err  error
	)

	if req.UserID != "" {
		user, err = h.roomService.GetUser(client.roomID, req.UserID)
		if err != nil {
			return err
		}
	} else {
		user, err = h.roomService.JoinRoom(client.roomID, req.DisplayName)
		if err != nil {
			return err
		}
	}

	if err := h.roomService.SetUserOnline(client.roomID, user.ID, true); err != nil {
		return err
	}
	client.userID = user.ID
	client.userData = &user

	session, err := h.roomService.GetRoom(client.roomID)
	if err != nil {
		return err
	}
	h.broadcast(client.roomID, "participant_joined", user)
	return h.send(client, "room_state", sessionForUser(session, user))
}

func (h *WebSocketHandler) send(client *wsClient, eventType string, payload any) error {
	data, err := json.Marshal(gin.H{
		"type":    eventType,
		"payload": payload,
	})
	if err != nil {
		return err
	}
	return client.Send(data)
}

func (h *WebSocketHandler) broadcast(roomID, eventType string, payload any) {
	data, err := json.Marshal(gin.H{
		"type":    eventType,
		"payload": payload,
	})
	if err != nil {
		return
	}
	h.hub.Broadcast(roomID, data)
}

func (h *WebSocketHandler) sendError(client *wsClient, code, message string) {
	_ = h.send(client, "error", gin.H{
		"code":    code,
		"message": message,
	})
}

func (h *WebSocketHandler) broadcastRoomState(roomID string) {
	session, err := h.roomService.GetRoom(roomID)
	if err != nil {
		return
	}
	for _, client := range h.hub.SnapshotClients(roomID) {
		wsClientRef, ok := client.(*wsClient)
		if !ok || wsClientRef.userID == "" {
			continue
		}
		user, userErr := h.roomService.GetUser(roomID, wsClientRef.userID)
		if userErr != nil {
			continue
		}
		_ = h.send(wsClientRef, "room_state", sessionForUser(session, user))
	}
}
