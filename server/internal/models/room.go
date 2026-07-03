package models

import "time"

type RoomStatus string

const (
	RoomStatusWaiting   RoomStatus = "waiting"
	RoomStatusVoting    RoomStatus = "voting"
	RoomStatusRevealed  RoomStatus = "revealed"
	RoomStatusConsensus RoomStatus = "consensus"
	RoomStatusClosed    RoomStatus = "closed"
)

type ConsensusAlgorithm string

const (
	ConsensusAlgorithmAverageNearest ConsensusAlgorithm = "average_nearest"
	ConsensusAlgorithmMedianNearest  ConsensusAlgorithm = "median_nearest"
	ConsensusAlgorithmManual         ConsensusAlgorithm = "manual"
)

type User struct {
	ID            string    `json:"id"`
	DisplayName   string    `json:"display_name"`
	IsFacilitator bool      `json:"is_facilitator"`
	CanVote       bool      `json:"can_vote"`
	JoinedAt      time.Time `json:"joined_at"`
	IsOnline      bool      `json:"is_online"`
}

type CardSubtask struct {
	ID    string `json:"id"`
	Title string `json:"title"`
	Done  bool   `json:"done"`
}

type QueuedCard struct {
	CardID             int           `json:"card_id"`
	CustomID           string        `json:"custom_id,omitempty"`
	Title              string        `json:"title"`
	Description        string        `json:"description,omitempty"`
	Color              string        `json:"color,omitempty"`
	Position           int           `json:"position"`
	Subtasks           []CardSubtask `json:"subtasks,omitempty"`
	ExcludedFromVoting bool          `json:"excluded_from_voting"`
	Estimated          *string       `json:"estimated,omitempty"`
}

type SessionSettings struct {
	FacilitatorName    string             `json:"facilitator_name"`
	FacilitatorRole    string             `json:"facilitator_role"`
	DeckValues         []string           `json:"deck_values"`
	ConsensusAlgorithm ConsensusAlgorithm `json:"consensus_algorithm"`
}

type PlanningSession struct {
	ID             string          `json:"id"`
	Name           string          `json:"name"`
	Status         RoomStatus      `json:"status"`
	Settings       SessionSettings `json:"settings"`
	Queue          []QueuedCard    `json:"queue"`
	CurrentCardIdx int             `json:"current_card_idx"`
	Participants   map[string]User `json:"participants"`
	CurrentRound   *VotingRound    `json:"current_round,omitempty"`
	CreatedAt      time.Time       `json:"created_at"`
	ExpiresAt      *time.Time      `json:"expires_at,omitempty"`
}
