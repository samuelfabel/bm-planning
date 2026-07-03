package services

import (
	"testing"
	"time"

	"github.com/msi/bm-planning/server/internal/models"
)

func TestCalculateConsensusExcludesNonVotingUsers(t *testing.T) {
	now := time.Now().UTC()
	round := &models.VotingRound{
		Votes: map[string]models.Vote{
			"u1": {UserID: "u1", Value: "3", CastAt: now},
			"u2": {UserID: "u2", Value: "8", CastAt: now},
			"u3": {UserID: "u3", Value: "13", CastAt: now},
		},
	}

	participants := map[string]models.User{
		"u1": {ID: "u1", CanVote: true},
		"u2": {ID: "u2", CanVote: true},
		"u3": {ID: "u3", CanVote: false},
	}

	result, err := CalculateConsensus(
		round,
		participants,
		[]string{"1", "2", "3", "5", "8", "13"},
		models.ConsensusAlgorithmAverageNearest,
	)
	if err != nil {
		t.Fatalf("calculate consensus: %v", err)
	}
	if result.Average == nil || *result.Average != 5.5 {
		t.Fatalf("average = %v, want 5.5", result.Average)
	}
	if result.SuggestedCard == nil || *result.SuggestedCard != "5" {
		t.Fatalf("suggested card = %v, want 5", result.SuggestedCard)
	}
}

func TestCalculateConsensusMedianNearest(t *testing.T) {
	now := time.Now().UTC()
	round := &models.VotingRound{
		Votes: map[string]models.Vote{
			"a": {UserID: "a", Value: "1", CastAt: now},
			"b": {UserID: "b", Value: "8", CastAt: now},
			"c": {UserID: "c", Value: "13", CastAt: now},
		},
	}
	participants := map[string]models.User{
		"a": {ID: "a", CanVote: true},
		"b": {ID: "b", CanVote: true},
		"c": {ID: "c", CanVote: true},
	}

	result, err := CalculateConsensus(
		round,
		participants,
		[]string{"1", "2", "3", "5", "8", "13"},
		models.ConsensusAlgorithmMedianNearest,
	)
	if err != nil {
		t.Fatalf("calculate consensus: %v", err)
	}
	if result.Median == nil || *result.Median != 8 {
		t.Fatalf("median = %v, want 8", result.Median)
	}
	if result.SuggestedCard == nil || *result.SuggestedCard != "8" {
		t.Fatalf("suggested card = %v, want 8", result.SuggestedCard)
	}
}
