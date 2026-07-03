package handlers

import (
	"github.com/gin-gonic/gin"
	"github.com/msi/bm-planning/server/internal/api/middlewares"
	"github.com/msi/bm-planning/server/internal/config"
	"github.com/msi/bm-planning/server/internal/metrics"
	"github.com/msi/bm-planning/server/internal/providers"
	"github.com/msi/bm-planning/server/internal/services"
)

func NewRouter(cfg config.Config) *gin.Engine {
	gin.SetMode(gin.ReleaseMode)

	router := gin.New()
	router.Use(gin.Recovery())
	router.Use(middlewares.SecurityHeaders())
	router.Use(middlewares.Logging())
	router.Use(middlewares.Prometheus())
	router.Use(middlewares.CORS(cfg.AllowedOrigins))

	healthHandler := &HealthHandler{}
	healthHandler.SetupRoutes(router)
	RegisterDocs(router)

	roomStore := providers.NewRoomStore(cfg.RoomGraceAfterDisconnect, cfg.MaxParticipants)
	hub := providers.NewHub()
	hub.Start()

	metrics.RoomsActive.Set(float64(roomStore.ActiveRoomCount()))
	metrics.WSConnections.Set(float64(hub.ConnectedClientCount()))

	roomService := services.NewRoomService(roomStore)
	votingService := services.NewVotingService(roomStore)

	api := router.Group("/api/v1")
	api.Use(middlewares.RateLimit(cfg.HTTPRateLimitPerMin))
	roomsHandler := NewRoomsHandler(roomService, roomStore)
	roomsHandler.SetupRoutes(api)

	roundsHandler := NewRoundsHandler(votingService)
	roundsHandler.SetupRoutes(api)

	wsHandler := NewWebSocketHandler(cfg.AllowedOrigins, hub, roomStore, roomService, votingService)
	wsHandler.SetupRoutes(api)

	return router
}
