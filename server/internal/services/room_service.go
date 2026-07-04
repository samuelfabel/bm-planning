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

/** Construct a room service backed by the given store.
 *
 * @param store - In-memory room store for session persistence.
 * @returns Configured RoomService instance.
 */
func NewRoomService(store *providers.RoomStore) *RoomService {
	return &RoomService{store: store}
}

/** Create a new room.
 * 
 * @param input - The input for creating a new room.
 * @returns The created room and the facilitator user.
 * @returns An error if the room creation fails.
 */
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

/** Fetch a snapshot of the room session by ID.
 *
 * @param roomID - Room identifier.
 * @returns Cloned session safe to use outside the store lock.
 * @returns An error when the room does not exist.
 */
func (s *RoomService) GetRoom(roomID string) (*models.PlanningSession, error) {
	entry, ok := s.store.Get(roomID)
	if !ok {
		return nil, newServiceError("room_not_found", "room not found", http.StatusNotFound)
	}
	entry.Lock()
	defer entry.Unlock()
	return cloneSession(entry.Session), nil
}

/** Close a room; only the facilitator may delete it.
 *
 * @param roomID - Room identifier.
 * @param userID - Acting user; must be the facilitator.
 * @returns An error when the room is missing, user is unknown, or not a facilitator.
 */
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

/** Add a new participant to the room.
 *
 * @param roomID - Room identifier.
 * @param displayName - Display name for the joining user.
 * @returns The created participant user.
 * @returns An error when the name is empty, room is missing, or room is full.
 */
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

/** Remove a participant from the room.
 *
 * @param roomID - Room identifier.
 * @param userID - Participant to remove.
 * @returns An error when the room or user is not found.
 */
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

/** Update a participant's online presence flag.
 *
 * @param roomID - Room identifier.
 * @param userID - Participant to update.
 * @param online - Whether the user is currently connected.
 * @returns An error when the room or user is not found.
 */
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

/** Replace the card queue; facilitator only.
 *
 * @param roomID - Room identifier.
 * @param userID - Acting user; must be the facilitator.
 * @param queue - New ordered card queue.
 * @returns Updated session snapshot with reset current card index.
 * @returns An error when the room is missing or user is not a facilitator.
 */
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

/** Patch fields on a queued card; facilitator only.
 *
 * @param roomID - Room identifier.
 * @param userID - Acting user; must be the facilitator.
 * @param input - Card ID and optional field updates.
 * @returns Updated card copy.
 * @returns Updated session snapshot.
 * @returns An error when the room, user, or card is not found or user is not a facilitator.
 */
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

/** Look up a participant in the room.
 *
 * @param roomID - Room identifier.
 * @param userID - Participant identifier.
 * @returns The participant user record.
 * @returns An error when the room or user is not found.
 */
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

/** Record a new WebSocket connection to the room.
 *
 * @param roomID - Room identifier.
 * @returns An error when the room is not found.
 */
func (s *RoomService) MarkConnectionStart(roomID string) error {
	return s.store.IncrementConnection(roomID)
}

/** Record a WebSocket disconnect from the room.
 *
 * @param roomID - Room identifier.
 * @returns An error when the room is not found.
 */
func (s *RoomService) MarkConnectionEnd(roomID string) error {
	return s.store.DecrementConnection(roomID)
}

/** Generate a random base62 room identifier with rm_ prefix.
 *
 * @returns New room ID string.
 * @returns An error if random bytes cannot be read.
 */
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

/** Generate a unique user identifier based on the current timestamp.
 *
 * @returns New user ID string.
 */
func generateUserID() string {
	return fmt.Sprintf("usr_%d", time.Now().UnixNano())
}

/** Copy a card queue and reassign zero-based position indices.
 *
 * @param queue - Source queue from the client or store.
 * @returns Normalized queue with contiguous positions.
 */
func normalizeQueue(queue []models.QueuedCard) []models.QueuedCard {
	out := make([]models.QueuedCard, len(queue))
	copy(out, queue)
	for idx := range out {
		out[idx].Position = idx
	}
	return out
}

/** Ensure the acting user is the room facilitator.
 *
 * @param session - Current room session.
 * @param userID - User attempting the action.
 * @returns An error when the user is missing or not a facilitator.
 */
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

/** Deep-copy a session for safe return outside the store lock.
 *
 * @param session - Session to clone.
 * @returns Independent copy including queue, participants, and current round.
 */
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
