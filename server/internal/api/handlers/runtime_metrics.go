package handlers

import (
	"github.com/msi/bm-planning/server/internal/metrics"
	"github.com/msi/bm-planning/server/internal/providers"
)

func refreshRuntimeMetrics(roomStore *providers.RoomStore, hub *providers.Hub) {
	if roomStore != nil {
		metrics.RoomsActive.Set(float64(roomStore.ActiveRoomCount()))
	}
	if hub != nil {
		metrics.WSConnections.Set(float64(hub.ConnectedClientCount()))
	}
}
