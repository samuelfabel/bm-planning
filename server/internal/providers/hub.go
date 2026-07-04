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

/** Create a new WebSocket broadcast hub.
 *
 * @returns Initialized Hub with empty room registry.
 */
func NewHub() *Hub {
	return &Hub{
		register:   make(chan HubClient, 32),
		unregister: make(chan HubClient, 32),
		broadcast:  make(chan broadcastMessage, 128),
		stop:       make(chan struct{}),
		rooms:      map[string]map[string]HubClient{},
	}
}

/** Start the hub event loop in a background goroutine.
 */
func (h *Hub) Start() {
	go h.run()
}

/** Signal the hub event loop to stop.
 */
func (h *Hub) Stop() {
	close(h.stop)
}

/** Register a client with the hub for its room.
 *
 * @param client - WebSocket client implementing HubClient.
 */
func (h *Hub) Register(client HubClient) {
	h.register <- client
}

/** Unregister a client from the hub.
 *
 * @param client - WebSocket client to remove.
 */
func (h *Hub) Unregister(client HubClient) {
	h.unregister <- client
}

/** Queue a message for broadcast to all clients in a room.
 *
 * @param roomID - Target room identifier.
 * @param message - Serialized message bytes to send.
 */
func (h *Hub) Broadcast(roomID string, message []byte) {
	h.broadcast <- broadcastMessage{roomID: roomID, message: message}
}

/** Return a snapshot of clients connected to a room.
 *
 * @param roomID - Target room identifier.
 * @returns Slice of hub clients currently in the room.
 */
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

/** Count all clients connected across every room.
 *
 * @returns Total number of registered WebSocket clients.
 */
func (h *Hub) ConnectedClientCount() int {
	h.mu.RLock()
	defer h.mu.RUnlock()
	total := 0
	for _, clients := range h.rooms {
		total += len(clients)
	}
	return total
}

/** Run the hub event loop until Stop closes the stop channel.
 *
 * Handles client register, unregister, and room broadcast messages.
 */
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
