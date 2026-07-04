package services

import (
	"net/http"
	"time"

	"github.com/msi/bm-planning/server/internal/models"
	"github.com/msi/bm-planning/server/internal/providers"
)

type VotingService struct {
	store *providers.RoomStore
}

/** Construct a voting service backed by the given store.
 *
 * @param store - In-memory room store for session persistence.
 * @returns Configured VotingService instance.
 */
func NewVotingService(store *providers.RoomStore) *VotingService {
	return &VotingService{store: store}
}

/** Start a voting round on the current queue card; facilitator only.
 *
 * @param roomID - Room identifier.
 * @param userID - Acting user; must be the facilitator.
 * @returns Updated session snapshot with a new current round.
 * @returns An error when the room is missing, user is not a facilitator, or queue is invalid.
 */
func (s *VotingService) StartRound(roomID, userID string) (*models.PlanningSession, error) {
	entry, ok := s.store.Get(roomID)
	if !ok {
		return nil, newServiceError("room_not_found", "room not found", http.StatusNotFound)
	}
	entry.Lock()
	defer entry.Unlock()
	if err := requireFacilitator(entry.Session, userID); err != nil {
		return nil, err
	}

	card, err := activeCard(entry.Session)
	if err != nil {
		return nil, err
	}
	entry.Session.Status = models.RoomStatusVoting
	entry.Session.CurrentRound = &models.VotingRound{
		CardID:    card.CardID,
		Votes:     map[string]models.Vote{},
		StartedAt: time.Now().UTC(),
	}
	return cloneSession(entry.Session), nil
}

/** Cast or update a vote in the active round.
 *
 * @param roomID - Room identifier.
 * @param userID - Voting participant.
 * @param value - Selected deck value.
 * @returns Updated session snapshot including the vote.
 * @returns An error when the room, user, or round is invalid or the user cannot vote.
 */
func (s *VotingService) Vote(roomID, userID, value string) (*models.PlanningSession, error) {
	entry, ok := s.store.Get(roomID)
	if !ok {
		return nil, newServiceError("room_not_found", "room not found", http.StatusNotFound)
	}
	entry.Lock()
	defer entry.Unlock()
	if entry.Session.CurrentRound == nil {
		return nil, newServiceError("round_not_started", "round not started", http.StatusConflict)
	}
	user, ok := entry.Session.Participants[userID]
	if !ok {
		return nil, newServiceError("user_not_found", "user not found", http.StatusNotFound)
	}
	if !user.CanVote {
		return nil, newServiceError("forbidden_vote", "user cannot vote", http.StatusForbidden)
	}

	entry.Session.CurrentRound.Votes[userID] = models.Vote{
		UserID:   userID,
		Value:    value,
		CastAt:   time.Now().UTC(),
		Revealed: entry.Session.Status == models.RoomStatusRevealed || entry.Session.Status == models.RoomStatusConsensus,
	}
	return cloneSession(entry.Session), nil
}

/** Reveal all votes and compute consensus statistics; facilitator only.
 *
 * @param roomID - Room identifier.
 * @param userID - Acting user; must be the facilitator.
 * @returns Updated session snapshot with revealed votes and consensus metrics.
 * @returns An error when the room is missing, user is not a facilitator, or no round is active.
 */
func (s *VotingService) Reveal(roomID, userID string) (*models.PlanningSession, error) {
	entry, ok := s.store.Get(roomID)
	if !ok {
		return nil, newServiceError("room_not_found", "room not found", http.StatusNotFound)
	}
	entry.Lock()
	defer entry.Unlock()
	if err := requireFacilitator(entry.Session, userID); err != nil {
		return nil, err
	}
	if entry.Session.CurrentRound == nil {
		return nil, newServiceError("round_not_started", "round not started", http.StatusConflict)
	}

	now := time.Now().UTC()
	entry.Session.Status = models.RoomStatusRevealed
	entry.Session.CurrentRound.RevealedAt = &now
	for key, vote := range entry.Session.CurrentRound.Votes {
		vote.Revealed = true
		entry.Session.CurrentRound.Votes[key] = vote
	}

	result, err := CalculateConsensus(
		entry.Session.CurrentRound,
		entry.Session.Participants,
		entry.Session.Settings.DeckValues,
		entry.Session.Settings.ConsensusAlgorithm,
	)
	if err != nil {
		return nil, err
	}
	entry.Session.CurrentRound.Average = result.Average
	entry.Session.CurrentRound.Median = result.Median
	entry.Session.CurrentRound.Suggested = result.SuggestedCard
	return cloneSession(entry.Session), nil
}

/** Reset the active round for a new vote; facilitator only.
 *
 * @param roomID - Room identifier.
 * @param userID - Acting user; must be the facilitator.
 * @returns Updated session snapshot with cleared votes and voting status restored.
 * @returns An error when the room is missing, user is not a facilitator, or no round is active.
 */
func (s *VotingService) Revote(roomID, userID string) (*models.PlanningSession, error) {
	entry, ok := s.store.Get(roomID)
	if !ok {
		return nil, newServiceError("room_not_found", "room not found", http.StatusNotFound)
	}
	entry.Lock()
	defer entry.Unlock()
	if err := requireFacilitator(entry.Session, userID); err != nil {
		return nil, err
	}
	if entry.Session.CurrentRound == nil {
		return nil, newServiceError("round_not_started", "round not started", http.StatusConflict)
	}

	entry.Session.Status = models.RoomStatusVoting
	entry.Session.CurrentRound.Votes = map[string]models.Vote{}
	entry.Session.CurrentRound.RevealedAt = nil
	entry.Session.CurrentRound.Consensus = nil
	entry.Session.CurrentRound.Average = nil
	entry.Session.CurrentRound.Median = nil
	entry.Session.CurrentRound.Suggested = nil
	return cloneSession(entry.Session), nil
}

/** Apply a consensus estimate to the current card; facilitator only.
 *
 * @param roomID - Room identifier.
 * @param userID - Acting user; must be the facilitator.
 * @param value - Agreed estimate value.
 * @param sync - Whether to flag sync to Businessmap on the round.
 * @returns Updated session snapshot with consensus status and estimate.
 * @returns An error when the room is missing, user is not a facilitator, or no round is active.
 */
func (s *VotingService) ApplyConsensus(roomID, userID, value string, sync bool) (*models.PlanningSession, error) {
	entry, ok := s.store.Get(roomID)
	if !ok {
		return nil, newServiceError("room_not_found", "room not found", http.StatusNotFound)
	}
	entry.Lock()
	defer entry.Unlock()
	if err := requireFacilitator(entry.Session, userID); err != nil {
		return nil, err
	}
	if entry.Session.CurrentRound == nil {
		return nil, newServiceError("round_not_started", "round not started", http.StatusConflict)
	}

	entry.Session.Status = models.RoomStatusConsensus
	entry.Session.CurrentRound.Consensus = &value
	entry.Session.CurrentRound.SyncToSource = sync

	if card, err := activeCard(entry.Session); err == nil {
		card.Estimated = &value
	}

	return cloneSession(entry.Session), nil
}

/** Skip the current card and advance when possible; facilitator only.
 *
 * @param roomID - Room identifier.
 * @param userID - Acting user; must be the facilitator.
 * @returns Updated session snapshot with cleared round and optional index advance.
 * @returns An error when the room is missing or user is not a facilitator.
 */
func (s *VotingService) Skip(roomID, userID string) (*models.PlanningSession, error) {
	entry, ok := s.store.Get(roomID)
	if !ok {
		return nil, newServiceError("room_not_found", "room not found", http.StatusNotFound)
	}
	entry.Lock()
	defer entry.Unlock()
	if err := requireFacilitator(entry.Session, userID); err != nil {
		return nil, err
	}
	entry.Session.CurrentRound = nil
	entry.Session.Status = models.RoomStatusWaiting
	if entry.Session.CurrentCardIdx < len(entry.Session.Queue)-1 {
		entry.Session.CurrentCardIdx++
	}
	return cloneSession(entry.Session), nil
}

/** Advance to the next queue card without voting; facilitator only.
 *
 * @param roomID - Room identifier.
 * @param userID - Acting user; must be the facilitator.
 * @returns Updated session snapshot with incremented card index.
 * @returns An error when the room is missing, user is not a facilitator, or queue is at the end.
 */
func (s *VotingService) Next(roomID, userID string) (*models.PlanningSession, error) {
	entry, ok := s.store.Get(roomID)
	if !ok {
		return nil, newServiceError("room_not_found", "room not found", http.StatusNotFound)
	}
	entry.Lock()
	defer entry.Unlock()
	if err := requireFacilitator(entry.Session, userID); err != nil {
		return nil, err
	}
	if entry.Session.CurrentCardIdx >= len(entry.Session.Queue)-1 {
		return nil, newServiceError("queue_end", "already at end of queue", http.StatusConflict)
	}
	entry.Session.CurrentCardIdx++
	entry.Session.CurrentRound = nil
	entry.Session.Status = models.RoomStatusWaiting
	return cloneSession(entry.Session), nil
}

/** Resolve the card currently active for voting in the session.
 *
 * @param session - Room session with queue and current index.
 * @returns Pointer to the active queued card.
 * @returns An error when the queue is empty or the index is invalid.
 */
func activeCard(session *models.PlanningSession) (*models.QueuedCard, error) {
	if len(session.Queue) == 0 {
		return nil, newServiceError("empty_queue", "room has no cards in queue", http.StatusConflict)
	}
	if session.CurrentCardIdx < 0 || session.CurrentCardIdx >= len(session.Queue) {
		return nil, newServiceError("invalid_card_index", "current card index is invalid", http.StatusConflict)
	}
	return &session.Queue[session.CurrentCardIdx], nil
}
