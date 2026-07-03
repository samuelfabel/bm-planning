package services

import (
	"crypto/rand"
	"errors"
	"fmt"
	"net/http"
	"strings"
	"time"

	"github.com/msi/bm-planning/server/internal/models"
	"github.com/msi/bm-planning/server/internal/providers"
)

const base62Chars = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ"

type RoomService struct {
	store *providers.RoomStore
}

type CreateRoomInput struct {
	Name        string                 `json:"name"`
	Settings    models.SessionSettings `json:"settings"`
	Queue       []models.QueuedCard    `json:"queue"`
	Facilitator struct {
		DisplayName string `json:"display_name"`
		Role        string `json:"role"`
	} `json:"facilitator"`
}

func NewRoomService(store *providers.RoomStore) *RoomService {
	return &RoomService{store: store}
}

func (s *RoomService) CreateRoom(input CreateRoomInput) (*models.PlanningSession, models.User, error) {
	if strings.TrimSpace(input.Name) == "" {
		return nil, models.User{}, newServiceError("invalid_room_name", "room name is required", http.StatusBadRequest)
	}
	if strings.TrimSpace(input.Facilitator.DisplayName) == "" {
		return nil, models.User{}, newServiceError("invalid_facilitator", "facilitator display_name is required", http.StatusBadRequest)
	}

	roomID, err := generateRoomID()
	if err != nil {
		return nil, models.User{}, err
	}
	facilitator := models.User{
		ID:            generateUserID(),
		DisplayName:   input.Facilitator.DisplayName,
		IsFacilitator: true,
		CanVote:       strings.EqualFold(input.Facilitator.Role, "participant"),
		JoinedAt:      time.Now().UTC(),
		IsOnline:      false,
	}

	session := &models.PlanningSession{
		ID:             roomID,
		Name:           input.Name,
		Status:         models.RoomStatusWaiting,
		Settings:       input.Settings,
		Queue:          normalizeQueue(input.Queue),
		CurrentCardIdx: 0,
		Participants:   map[string]models.User{facilitator.ID: facilitator},
		CreatedAt:      time.Now().UTC(),
	}

	if err := s.store.Create(session); err != nil {
		if errors.Is(err, providers.ErrRoomAlreadyExists) {
			return nil, models.User{}, newServiceError("room_exists", "room already exists", http.StatusConflict)
		}
		return nil, models.User{}, err
	}

	return session, facilitator, nil
}

func (s *RoomService) GetRoom(roomID string) (*models.PlanningSession, error) {
	entry, ok := s.store.Get(roomID)
	if !ok {
		return nil, newServiceError("room_not_found", "room not found", http.StatusNotFound)
	}
	entry.Lock()
	defer entry.Unlock()
	return cloneSession(entry.Session), nil
}

func (s *RoomService) DeleteRoom(roomID, userID string) error {
	entry, ok := s.store.Get(roomID)
	if !ok {
		return newServiceError("room_not_found", "room not found", http.StatusNotFound)
	}
	entry.Lock()
	defer entry.Unlock()

	user, ok := entry.Session.Participants[userID]
	if !ok || !user.IsFacilitator {
		return newServiceError("forbidden", "facilitator only", http.StatusForbidden)
	}
	entry.Session.Status = models.RoomStatusClosed
	s.store.Delete(roomID)
	return nil
}

func (s *RoomService) JoinRoom(roomID, displayName string) (models.User, error) {
	if strings.TrimSpace(displayName) == "" {
		return models.User{}, newServiceError("invalid_display_name", "display_name is required", http.StatusBadRequest)
	}
	entry, ok := s.store.Get(roomID)
	if !ok {
		return models.User{}, newServiceError("room_not_found", "room not found", http.StatusNotFound)
	}
	entry.Lock()
	defer entry.Unlock()

	if len(entry.Session.Participants) >= s.store.MaxParticipants() {
		return models.User{}, newServiceError("room_full", "max participants reached", http.StatusConflict)
	}

	user := models.User{
		ID:            generateUserID(),
		DisplayName:   displayName,
		IsFacilitator: false,
		CanVote:       true,
		JoinedAt:      time.Now().UTC(),
		IsOnline:      false,
	}
	entry.Session.Participants[user.ID] = user
	return user, nil
}

func (s *RoomService) LeaveRoom(roomID, userID string) error {
	entry, ok := s.store.Get(roomID)
	if !ok {
		return newServiceError("room_not_found", "room not found", http.StatusNotFound)
	}
	entry.Lock()
	defer entry.Unlock()
	if _, ok := entry.Session.Participants[userID]; !ok {
		return newServiceError("user_not_found", "user not found", http.StatusNotFound)
	}
	delete(entry.Session.Participants, userID)
	return nil
}

func (s *RoomService) SetUserOnline(roomID, userID string, online bool) error {
	entry, ok := s.store.Get(roomID)
	if !ok {
		return newServiceError("room_not_found", "room not found", http.StatusNotFound)
	}
	entry.Lock()
	defer entry.Unlock()
	user, ok := entry.Session.Participants[userID]
	if !ok {
		return newServiceError("user_not_found", "user not found", http.StatusNotFound)
	}
	user.IsOnline = online
	entry.Session.Participants[userID] = user
	return nil
}

func (s *RoomService) UpdateQueue(roomID, userID string, queue []models.QueuedCard) (*models.PlanningSession, error) {
	entry, ok := s.store.Get(roomID)
	if !ok {
		return nil, newServiceError("room_not_found", "room not found", http.StatusNotFound)
	}
	entry.Lock()
	defer entry.Unlock()
	if err := requireFacilitator(entry.Session, userID); err != nil {
		return nil, err
	}

	entry.Session.Queue = normalizeQueue(queue)
	entry.Session.CurrentCardIdx = 0
	return cloneSession(entry.Session), nil
}

type UpdateCardInput struct {
	CardID             int                  `json:"card_id"`
	Description        *string              `json:"description,omitempty"`
	Subtasks           []models.CardSubtask `json:"subtasks,omitempty"`
	ExcludedFromVoting *bool                `json:"excluded_from_voting,omitempty"`
}

func (s *RoomService) UpdateCard(roomID, userID string, input UpdateCardInput) (*models.QueuedCard, *models.PlanningSession, error) {
	entry, ok := s.store.Get(roomID)
	if !ok {
		return nil, nil, newServiceError("room_not_found", "room not found", http.StatusNotFound)
	}
	entry.Lock()
	defer entry.Unlock()
	if err := requireFacilitator(entry.Session, userID); err != nil {
		return nil, nil, err
	}

	for i := range entry.Session.Queue {
		card := &entry.Session.Queue[i]
		if card.CardID != input.CardID {
			continue
		}
		if input.Description != nil {
			card.Description = *input.Description
		}
		if input.Subtasks != nil {
			card.Subtasks = input.Subtasks
		}
		if input.ExcludedFromVoting != nil {
			card.ExcludedFromVoting = *input.ExcludedFromVoting
		}
		copyCard := *card
		return &copyCard, cloneSession(entry.Session), nil
	}

	return nil, nil, newServiceError("card_not_found", "card not found in queue", http.StatusNotFound)
}

func (s *RoomService) GetUser(roomID, userID string) (models.User, error) {
	entry, ok := s.store.Get(roomID)
	if !ok {
		return models.User{}, newServiceError("room_not_found", "room not found", http.StatusNotFound)
	}
	entry.Lock()
	defer entry.Unlock()
	user, ok := entry.Session.Participants[userID]
	if !ok {
		return models.User{}, newServiceError("user_not_found", "user not found", http.StatusNotFound)
	}
	return user, nil
}

func (s *RoomService) MarkConnectionStart(roomID string) error {
	return s.store.IncrementConnection(roomID)
}

func (s *RoomService) MarkConnectionEnd(roomID string) error {
	return s.store.DecrementConnection(roomID)
}

func generateRoomID() (string, error) {
	const size = 8
	b := make([]byte, size)
	if _, err := rand.Read(b); err != nil {
		return "", fmt.Errorf("generate room id: %w", err)
	}
	for i := range b {
		b[i] = base62Chars[int(b[i])%len(base62Chars)]
	}
	return "rm_" + string(b), nil
}

func generateUserID() string {
	return fmt.Sprintf("usr_%d", time.Now().UnixNano())
}

func normalizeQueue(queue []models.QueuedCard) []models.QueuedCard {
	out := make([]models.QueuedCard, len(queue))
	copy(out, queue)
	for idx := range out {
		out[idx].Position = idx
	}
	return out
}

func requireFacilitator(session *models.PlanningSession, userID string) error {
	user, ok := session.Participants[userID]
	if !ok {
		return newServiceError("user_not_found", "user not found", http.StatusNotFound)
	}
	if !user.IsFacilitator {
		return newServiceError("forbidden", "facilitator only", http.StatusForbidden)
	}
	return nil
}

func cloneSession(session *models.PlanningSession) *models.PlanningSession {
	copied := *session
	copied.Queue = append([]models.QueuedCard(nil), session.Queue...)
	copied.Participants = map[string]models.User{}
	for key, value := range session.Participants {
		copied.Participants[key] = value
	}
	if session.CurrentRound != nil {
		round := *session.CurrentRound
		round.Votes = map[string]models.Vote{}
		for key, value := range session.CurrentRound.Votes {
			round.Votes[key] = value
		}
		copied.CurrentRound = &round
	}
	return &copied
}
