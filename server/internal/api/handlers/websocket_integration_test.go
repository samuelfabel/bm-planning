package handlers

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
	"time"

	"github.com/gorilla/websocket"
	"github.com/msi/bm-planning/server/internal/config"
)

func TestWebSocketTwoClientsVoteFlow(t *testing.T) {
	router := NewRouter(config.Config{
		Port:                     "0",
		AllowedOrigins:           []string{"http://example.com"},
		MaxParticipants:          50,
		RoomGraceAfterDisconnect: time.Hour,
	})
	server := httptest.NewServer(router)
	defer server.Close()

	createBody := map[string]any{
		"name": "Sprint planning",
		"settings": map[string]any{
			"facilitator_name":    "Ana",
			"facilitator_role":    "participant",
			"deck_values":         []string{"1", "2", "3", "5", "8"},
			"consensus_algorithm": "average_nearest",
		},
		"queue": []map[string]any{
			{"card_id": 101, "title": "Card 101"},
		},
		"facilitator": map[string]any{
			"display_name": "Ana",
			"role":         "participant",
		},
	}

	createResp := doJSON(t, server.URL+"/api/v1/rooms", createBody, http.StatusCreated)
	roomID := createResp["id"].(string)
	facilitator := createResp["facilitator"].(map[string]any)
	facilitatorUserID := facilitator["id"].(string)

	joinResp := doJSON(t, server.URL+"/api/v1/rooms/"+roomID+"/join", map[string]any{
		"display_name": "Bruno",
	}, http.StatusCreated)
	participantUserID := joinResp["id"].(string)

	wsURL := "ws" + strings.TrimPrefix(server.URL, "http") + "/api/v1/rooms/" + roomID + "/live"
	facilitatorConn := dialWS(t, wsURL)
	defer facilitatorConn.Close()
	participantConn := dialWS(t, wsURL)
	defer participantConn.Close()

	writeWS(t, facilitatorConn, map[string]any{
		"type": "join",
		"payload": map[string]any{
			"user_id": facilitatorUserID,
		},
	})
	waitForMessageType(t, facilitatorConn, "room_state")

	writeWS(t, participantConn, map[string]any{
		"type": "join",
		"payload": map[string]any{
			"user_id": participantUserID,
		},
	})
	waitForMessageType(t, participantConn, "room_state")
	waitForMessageType(t, facilitatorConn, "participant_joined")

	writeWS(t, facilitatorConn, map[string]any{"type": "start_round"})
	waitForMessageType(t, participantConn, "round_started")

	writeWS(t, participantConn, map[string]any{
		"type":    "vote",
		"payload": map[string]any{"value": "8"},
	})
	waitForMessageType(t, facilitatorConn, "vote_received")
}

func doJSON(t *testing.T, url string, body any, expectedStatus int) map[string]any {
	t.Helper()
	raw, err := json.Marshal(body)
	if err != nil {
		t.Fatalf("marshal body: %v", err)
	}
	req, err := http.NewRequest(http.MethodPost, url, bytes.NewReader(raw))
	if err != nil {
		t.Fatalf("create request: %v", err)
	}
	req.Header.Set("Content-Type", "application/json")

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		t.Fatalf("request failed: %v", err)
	}
	defer resp.Body.Close()
	if resp.StatusCode != expectedStatus {
		t.Fatalf("status = %d, want %d", resp.StatusCode, expectedStatus)
	}

	var out map[string]any
	if err := json.NewDecoder(resp.Body).Decode(&out); err != nil {
		t.Fatalf("decode response: %v", err)
	}
	return out
}

func dialWS(t *testing.T, url string) *websocket.Conn {
	t.Helper()
	conn, _, err := websocket.DefaultDialer.Dial(url, http.Header{"Origin": []string{"http://example.com"}})
	if err != nil {
		t.Fatalf("dial websocket: %v", err)
	}
	return conn
}

func writeWS(t *testing.T, conn *websocket.Conn, payload any) {
	t.Helper()
	if err := conn.WriteJSON(payload); err != nil {
		t.Fatalf("write websocket: %v", err)
	}
}

func waitForMessageType(t *testing.T, conn *websocket.Conn, eventType string) map[string]any {
	t.Helper()
	_ = conn.SetReadDeadline(time.Now().Add(2 * time.Second))
	for {
		var msg map[string]any
		if err := conn.ReadJSON(&msg); err != nil {
			t.Fatalf("read websocket message: %v", err)
		}
		currentType, _ := msg["type"].(string)
		if currentType == eventType {
			return msg
		}
	}
}
