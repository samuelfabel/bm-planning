package handlers

import (
	"github.com/msi/bm-planning/server/internal/metrics"
	"github.com/msi/bm-planning/server/internal/providers"
)

/** Refresh Prometheus gauges from live room and WebSocket hub state.
 *
 * @param roomStore - Room store for active room count; nil skips room metrics.
 * @param hub - WebSocket hub for connection count; nil skips WS metrics.
 */
func refreshRuntimeMetrics(roomStore *providers.RoomStore, hub *providers.Hub) {
	if roomStore != nil {
		metrics.RoomsActive.Set(float64(roomStore.ActiveRoomCount()))
	}
	if hub != nil {
		metrics.WSConnections.Set(float64(hub.ConnectedClientCount()))
	}
}
