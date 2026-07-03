package models

import "time"

type Vote struct {
	UserID   string    `json:"user_id"`
	Value    string    `json:"value"`
	CastAt   time.Time `json:"cast_at"`
	Revealed bool      `json:"revealed"`
}

type VotingRound struct {
	CardID       int             `json:"card_id"`
	Votes        map[string]Vote `json:"votes"`
	StartedAt    time.Time       `json:"started_at"`
	RevealedAt   *time.Time      `json:"revealed_at,omitempty"`
	Consensus    *string         `json:"consensus,omitempty"`
	Average      *float64        `json:"average,omitempty"`
	Median       *float64        `json:"median,omitempty"`
	Suggested    *string         `json:"suggested,omitempty"`
	SyncToSource bool            `json:"sync_to_businessmap"`
}
