package main

import (
	"fmt"
	"log/slog"
	"os"

	"github.com/msi/bm-planning/server/internal/api/handlers"
	"github.com/msi/bm-planning/server/internal/config"
	"github.com/msi/bm-planning/server/internal/static"
)

func main() {
	cfg := config.Load()
	logger := slog.New(slog.NewJSONHandler(os.Stdout, nil))
	slog.SetDefault(logger)

	router := handlers.NewRouter(cfg)
	static.RegisterSPA(router)

	addr := fmt.Sprintf(":%s", cfg.Port)
	slog.Info("starting server", "addr", addr, "framework", "gin")
	if err := router.Run(addr); err != nil {
		slog.Error("server stopped", "error", err)
		os.Exit(1)
	}
}
