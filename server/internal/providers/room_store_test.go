package providers

import (
	"testing"
	"time"

	"github.com/msi/bm-planning/server/internal/models"
)

func TestRoomStoreTTLAfterDisconnect(t *testing.T) {
	now := time.Date(2026, 7, 2, 20, 0, 0, 0, time.UTC)
	store := NewRoomStore(time.Hour, 50)
	defer store.Stop()
	store.now = func() time.Time { return now }

	session := &models.PlanningSession{
		ID:           "rm_test",
		Participants: map[string]models.User{},
	}

	if err := store.Create(session); err != nil {
		t.Fatalf("create room: %v", err)
	}
	if err := store.IncrementConnection(session.ID); err != nil {
		t.Fatalf("increment connection: %v", err)
	}
	if err := store.DecrementConnection(session.ID); err != nil {
		t.Fatalf("decrement connection: %v", err)
	}

	entry, ok := store.Get(session.ID)
	if !ok {
		t.Fatal("room should exist")
	}
	if entry.DisconnectAt == nil {
		t.Fatal("disconnect timestamp should be set")
	}

	now = now.Add(59 * time.Minute)
	store.CleanupExpiredRooms()
	if _, ok := store.Get(session.ID); !ok {
		t.Fatal("room removed too early")
	}

	now = now.Add(2 * time.Minute)
	store.CleanupExpiredRooms()
	if _, ok := store.Get(session.ID); ok {
		t.Fatal("room should be removed after grace period")
	}
}
