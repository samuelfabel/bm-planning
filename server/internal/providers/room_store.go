package providers

import (
	"errors"
	"sync"
	"time"

	"github.com/msi/bm-planning/server/internal/models"
)

var (
	ErrRoomAlreadyExists = errors.New("room already exists")
	ErrRoomNotFound      = errors.New("room not found")
)

type RoomEntry struct {
	Session          *models.PlanningSession
	ConnectedClients int
	DisconnectAt     *time.Time
	mu               sync.RWMutex
}

func (r *RoomEntry) Lock() {
	r.mu.Lock()
}

func (r *RoomEntry) Unlock() {
	r.mu.Unlock()
}

type RoomStore struct {
	rooms                map[string]*RoomEntry
	maxParticipants      int
	graceAfterDisconnect time.Duration
	cleanupInterval      time.Duration
	now                  func() time.Time
	mu                   sync.RWMutex
	stopCleanup          chan struct{}
}

func NewRoomStore(graceAfterDisconnect time.Duration, maxParticipants int) *RoomStore {
	store := &RoomStore{
		rooms:                map[string]*RoomEntry{},
		maxParticipants:      maxParticipants,
		graceAfterDisconnect: graceAfterDisconnect,
		cleanupInterval:      time.Minute,
		now:                  time.Now,
		stopCleanup:          make(chan struct{}),
	}
	go store.cleanupLoop()
	return store
}

func (s *RoomStore) Stop() {
	close(s.stopCleanup)
}

func (s *RoomStore) MaxParticipants() int {
	return s.maxParticipants
}

func (s *RoomStore) ActiveRoomCount() int {
	s.mu.RLock()
	defer s.mu.RUnlock()
	return len(s.rooms)
}

func (s *RoomStore) Create(session *models.PlanningSession) error {
	s.mu.Lock()
	defer s.mu.Unlock()
	if _, exists := s.rooms[session.ID]; exists {
		return ErrRoomAlreadyExists
	}
	s.rooms[session.ID] = &RoomEntry{Session: session}
	return nil
}

func (s *RoomStore) Get(roomID string) (*RoomEntry, bool) {
	s.mu.RLock()
	defer s.mu.RUnlock()
	entry, ok := s.rooms[roomID]
	return entry, ok
}

func (s *RoomStore) Delete(roomID string) {
	s.mu.Lock()
	defer s.mu.Unlock()
	delete(s.rooms, roomID)
}

func (s *RoomStore) IncrementConnection(roomID string) error {
	entry, ok := s.Get(roomID)
	if !ok {
		return ErrRoomNotFound
	}
	entry.Lock()
	defer entry.Unlock()

	entry.ConnectedClients++
	entry.DisconnectAt = nil
	entry.Session.ExpiresAt = nil
	return nil
}

func (s *RoomStore) DecrementConnection(roomID string) error {
	entry, ok := s.Get(roomID)
	if !ok {
		return ErrRoomNotFound
	}
	entry.Lock()
	defer entry.Unlock()

	if entry.ConnectedClients > 0 {
		entry.ConnectedClients--
	}
	if entry.ConnectedClients == 0 {
		exp := s.now().Add(s.graceAfterDisconnect)
		entry.DisconnectAt = &exp
		entry.Session.ExpiresAt = &exp
	}
	return nil
}

func (s *RoomStore) CleanupExpiredRooms() {
	now := s.now()
	s.mu.Lock()
	defer s.mu.Unlock()

	for roomID, entry := range s.rooms {
		entry.Lock()
		expired := entry.DisconnectAt != nil && now.After(*entry.DisconnectAt)
		entry.Unlock()
		if expired {
			delete(s.rooms, roomID)
		}
	}
}

func (s *RoomStore) cleanupLoop() {
	ticker := time.NewTicker(s.cleanupInterval)
	defer ticker.Stop()

	for {
		select {
		case <-ticker.C:
			s.CleanupExpiredRooms()
		case <-s.stopCleanup:
			return
		}
	}
}
