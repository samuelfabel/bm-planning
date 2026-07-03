package providers

import (
	"sync"
	"testing"
	"time"
)

type fakeHubClient struct {
	id      string
	roomID  string
	mu      sync.Mutex
	payload [][]byte
}

func (c *fakeHubClient) ID() string     { return c.id }
func (c *fakeHubClient) RoomID() string { return c.roomID }
func (c *fakeHubClient) Send(message []byte) error {
	c.mu.Lock()
	defer c.mu.Unlock()
	c.payload = append(c.payload, append([]byte(nil), message...))
	return nil
}

func (c *fakeHubClient) messageCount() int {
	c.mu.Lock()
	defer c.mu.Unlock()
	return len(c.payload)
}

func TestHubBroadcastToRoom(t *testing.T) {
	hub := NewHub()
	hub.Start()
	defer hub.Stop()

	roomClientA := &fakeHubClient{id: "a", roomID: "rm_1"}
	roomClientB := &fakeHubClient{id: "b", roomID: "rm_1"}
	otherRoomClient := &fakeHubClient{id: "c", roomID: "rm_2"}

	hub.Register(roomClientA)
	hub.Register(roomClientB)
	hub.Register(otherRoomClient)

	deadline := time.Now().Add(500 * time.Millisecond)
	for len(hub.SnapshotClients("rm_1")) < 2 && time.Now().Before(deadline) {
		time.Sleep(10 * time.Millisecond)
	}

	hub.Broadcast("rm_1", []byte(`{"type":"ping"}`))
	time.Sleep(30 * time.Millisecond)

	if roomClientA.messageCount() != 1 {
		t.Fatalf("client A message count = %d, want 1", roomClientA.messageCount())
	}
	if roomClientB.messageCount() != 1 {
		t.Fatalf("client B message count = %d, want 1", roomClientB.messageCount())
	}
	if otherRoomClient.messageCount() != 0 {
		t.Fatalf("other room message count = %d, want 0", otherRoomClient.messageCount())
	}
}
