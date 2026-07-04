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

/** Acquire an exclusive lock on the room entry.
 */
func (r *RoomEntry) Lock() {
	r.mu.Lock()
}

/** Release the exclusive lock on the room entry.
 */
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

/** Create an in-memory room store with periodic expiry cleanup.
 *
 * @param graceAfterDisconnect - Duration to retain a room after the last client disconnects.
 * @param maxParticipants - Maximum participants allowed per room.
 * @returns Initialized RoomStore with background cleanup goroutine.
 */
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

/** Stop the background cleanup goroutine.
 */
func (s *RoomStore) Stop() {
	close(s.stopCleanup)
}

/** Return the configured maximum participants per room.
 *
 * @returns Participant limit.
 */
func (s *RoomStore) MaxParticipants() int {
	return s.maxParticipants
}

/** Count rooms currently held in the store.
 *
 * @returns Number of active room entries.
 */
func (s *RoomStore) ActiveRoomCount() int {
	s.mu.RLock()
	defer s.mu.RUnlock()
	return len(s.rooms)
}

/** Persist a new planning session in the store.
 *
 * @param session - Session to store; ID must be unique.
 * @returns An error when a room with the same ID already exists.
 */
func (s *RoomStore) Create(session *models.PlanningSession) error {
	s.mu.Lock()
	defer s.mu.Unlock()
	if _, exists := s.rooms[session.ID]; exists {
		return ErrRoomAlreadyExists
	}
	s.rooms[session.ID] = &RoomEntry{Session: session}
	return nil
}

/** Look up a room entry by identifier.
 *
 * @param roomID - Room identifier.
 * @returns Room entry and true when found.
 * @returns nil and false when the room does not exist.
 */
func (s *RoomStore) Get(roomID string) (*RoomEntry, bool) {
	s.mu.RLock()
	defer s.mu.RUnlock()
	entry, ok := s.rooms[roomID]
	return entry, ok
}

/** Remove a room from the store immediately.
 *
 * @param roomID - Room identifier to delete.
 */
func (s *RoomStore) Delete(roomID string) {
	s.mu.Lock()
	defer s.mu.Unlock()
	delete(s.rooms, roomID)
}

/** Increment live connection count and clear room expiry.
 *
 * @param roomID - Room identifier.
 * @returns An error when the room is not found.
 */
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

/** Decrement live connection count and schedule expiry when zero.
 *
 * @param roomID - Room identifier.
 * @returns An error when the room is not found.
 */
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

/** Delete rooms whose grace period after last disconnect has elapsed.
 */
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

/** Periodically delete rooms whose grace period after last disconnect has expired.
 *
 * Stops when Stop closes the store cleanup channel.
 */
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
