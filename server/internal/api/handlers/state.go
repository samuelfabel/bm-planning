package handlers

import "github.com/msi/bm-planning/server/internal/models"

func sessionForUser(session *models.PlanningSession, user models.User) *models.PlanningSession {
	if user.IsFacilitator {
		return session
	}

	filtered := *session
	filteredQueue := make([]models.QueuedCard, 0, len(session.Queue))
	currentCardID := -1
	if session.CurrentCardIdx >= 0 && session.CurrentCardIdx < len(session.Queue) {
		currentCardID = session.Queue[session.CurrentCardIdx].CardID
	}

	newCurrent := -1
	for _, card := range session.Queue {
		if card.ExcludedFromVoting {
			continue
		}
		filteredQueue = append(filteredQueue, card)
		if card.CardID == currentCardID {
			newCurrent = len(filteredQueue) - 1
		}
	}

	filtered.Queue = filteredQueue
	filtered.CurrentCardIdx = newCurrent
	return &filtered
}
