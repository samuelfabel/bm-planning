package providers

import "sync"

type HubClient interface {
	ID() string
	RoomID() string
	Send(message []byte) error
}

type broadcastMessage struct {
	roomID  string
	message []byte
}

type Hub struct {
	register   chan HubClient
	unregister chan HubClient
	broadcast  chan broadcastMessage
	stop       chan struct{}

	rooms map[string]map[string]HubClient
	mu    sync.RWMutex
}

func NewHub() *Hub {
	return &Hub{
		register:   make(chan HubClient, 32),
		unregister: make(chan HubClient, 32),
		broadcast:  make(chan broadcastMessage, 128),
		stop:       make(chan struct{}),
		rooms:      map[string]map[string]HubClient{},
	}
}

func (h *Hub) Start() {
	go h.run()
}

func (h *Hub) Stop() {
	close(h.stop)
}

func (h *Hub) Register(client HubClient) {
	h.register <- client
}

func (h *Hub) Unregister(client HubClient) {
	h.unregister <- client
}

func (h *Hub) Broadcast(roomID string, message []byte) {
	h.broadcast <- broadcastMessage{roomID: roomID, message: message}
}

func (h *Hub) SnapshotClients(roomID string) []HubClient {
	h.mu.RLock()
	defer h.mu.RUnlock()

	clientsMap := h.rooms[roomID]
	out := make([]HubClient, 0, len(clientsMap))
	for _, client := range clientsMap {
		out = append(out, client)
	}
	return out
}

func (h *Hub) ConnectedClientCount() int {
	h.mu.RLock()
	defer h.mu.RUnlock()
	total := 0
	for _, clients := range h.rooms {
		total += len(clients)
	}
	return total
}

func (h *Hub) run() {
	for {
		select {
		case client := <-h.register:
			h.mu.Lock()
			if _, ok := h.rooms[client.RoomID()]; !ok {
				h.rooms[client.RoomID()] = map[string]HubClient{}
			}
			h.rooms[client.RoomID()][client.ID()] = client
			h.mu.Unlock()
		case client := <-h.unregister:
			h.mu.Lock()
			clients, ok := h.rooms[client.RoomID()]
			if ok {
				delete(clients, client.ID())
				if len(clients) == 0 {
					delete(h.rooms, client.RoomID())
				}
			}
			h.mu.Unlock()
		case event := <-h.broadcast:
			clients := h.SnapshotClients(event.roomID)
			for _, client := range clients {
				_ = client.Send(event.message)
			}
		case <-h.stop:
			return
		}
	}
}
